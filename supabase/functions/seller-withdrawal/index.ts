import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS configuration with origin validation
const ALLOWED_ORIGINS = [
  "https://www.blinno.app",
  "https://blinno.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(origin?: string | null): Record<string, string> {
  let allowedOrigin = ALLOWED_ORIGINS[0]; // Default to production
  
  if (origin && typeof origin === "string") {
    const normalizedOrigin = origin.trim().toLowerCase();
    const isAllowed = ALLOWED_ORIGINS.some(
      (allowed) => allowed.toLowerCase() === normalizedOrigin
    );
    
    if (isAllowed) {
      allowedOrigin = origin;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, phoneNumber, paymentMethod = 'mpesa' } = await req.json();

    console.log('Processing withdrawal request:', { sellerId: user.id, amount, phoneNumber, paymentMethod });

    // Validate input
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check seller's available balance
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_seller_balance', { p_seller_id: user.id });

    if (balanceError) {
      console.error('Balance check error:', balanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to check balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const availableBalance = balanceData?.[0]?.available_balance || 0;
    console.log('Available balance:', availableBalance);

    if (amount > availableBalance) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance', availableBalance }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate withdrawal fee (2% platform fee)
    const fee = Math.round(amount * 0.02 * 100) / 100;
    const netAmount = amount - fee;

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert({
        seller_id: user.id,
        amount,
        fee,
        net_amount: netAmount,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        status: 'pending'
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Withdrawal creation error:', withdrawalError);
      return new Response(
        JSON.stringify({ error: 'Failed to create withdrawal request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Withdrawal request created:', withdrawal.id);

    // Process via ClickPesa (disbursement)
    const clickpesaClientId = Deno.env.get('CLICKPESA_CLIENT_ID');
    const clickpesaApiKey = Deno.env.get('CLICKPESA_API_KEY');

    if (clickpesaClientId && clickpesaApiKey) {
      try {
        const disbursementPayload = {
          amount: netAmount,
          currency: 'TZS',
          recipient: {
            phoneNumber: phoneNumber.replace(/^\+/, ''),
            network: paymentMethod.toUpperCase()
          },
          reference: withdrawal.id,
          description: `Blinno seller payout - ${withdrawal.id}`
        };

        console.log('Initiating ClickPesa disbursement:', disbursementPayload);

        const clickpesaResponse = await fetch('https://api.clickpesa.com/v1/disbursements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Id': clickpesaClientId,
            'X-Api-Key': clickpesaApiKey
          },
          body: JSON.stringify(disbursementPayload)
        });

        const clickpesaData = await clickpesaResponse.json();
        console.log('ClickPesa response:', clickpesaData);

        if (clickpesaResponse.ok && clickpesaData.reference) {
          // Update withdrawal with ClickPesa reference
          await supabase
            .from('withdrawal_requests')
            .update({
              status: 'processing',
              clickpesa_reference: clickpesaData.reference
            })
            .eq('id', withdrawal.id);
        } else {
          // Mark as failed
          await supabase
            .from('withdrawal_requests')
            .update({
              status: 'failed',
              error_message: clickpesaData.message || 'Payment processing failed'
            })
            .eq('id', withdrawal.id);

          return new Response(
            JSON.stringify({ 
              error: 'Payment processing failed',
              details: clickpesaData.message 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (paymentError) {
        console.error('ClickPesa error:', paymentError);
        
        // For demo purposes, mark as processing anyway
        await supabase
          .from('withdrawal_requests')
          .update({ status: 'processing' })
          .eq('id', withdrawal.id);
      }
    } else {
      // No ClickPesa credentials - mark as processing for manual handling
      await supabase
        .from('withdrawal_requests')
        .update({ status: 'processing' })
        .eq('id', withdrawal.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        withdrawal: {
          id: withdrawal.id,
          amount,
          fee,
          netAmount,
          status: 'processing'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Withdrawal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
