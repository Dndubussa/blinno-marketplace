import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

interface PaymentRequest {
  amount: number;
  currency: string;
  phone_number: string;
  network: "MPESA" | "TIGOPESA" | "AIRTELMONEY" | "HALOPESA";
  reference: string;
  description: string;
  order_id?: string;
}

let cachedToken: string = "";
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string> {
  const now = Date.now();
  
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && tokenExpiry > now + 300000) {
    return cachedToken;
  }

  const clientId = Deno.env.get("CLICKPESA_CLIENT_ID");
  const apiKey = Deno.env.get("CLICKPESA_API_KEY");

  if (!clientId || !apiKey) {
    console.error("Missing ClickPesa credentials:", {
      hasClientId: !!clientId,
      hasApiKey: !!apiKey
    });
    throw new Error("ClickPesa credentials not configured. Please check environment variables CLICKPESA_CLIENT_ID and CLICKPESA_API_KEY");
  }

  console.log("Generating new ClickPesa auth token...");

  const response = await fetch("https://api.clickpesa.com/third-parties/generate-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "client-id": clientId,
      "api-key": apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("ClickPesa auth error:", error);
    throw new Error(`Failed to authenticate with ClickPesa: ${error}`);
  }

  const data = await response.json();
  
  if (!data.success || !data.token) {
    throw new Error("Invalid response from ClickPesa auth");
  }

  cachedToken = data.token;
  tokenExpiry = now + 3600000; // Token valid for 1 hour

  console.log("ClickPesa auth token generated successfully");
  return cachedToken;
}

/**
 * Step 1: Preview/Validate USSD-PUSH Request
 * Validates payment details and verifies payment method availability
 */
async function validatePayment(token: string, payload: PaymentRequest) {
  console.log("Validating ClickPesa payment details...", { 
    amount: payload.amount, 
    network: payload.network,
    reference: payload.reference 
  });

  const response = await fetch("https://api.clickpesa.com/third-parties/ussd-push/preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token,
    },
    body: JSON.stringify({
      amount: payload.amount,
      currency: payload.currency || "TZS",
      phone_number: payload.phone_number,
      network: payload.network,
      reference: payload.reference,
      description: payload.description,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("ClickPesa validation error:", error);
    throw new Error(`Payment validation failed: ${error}`);
  }

  return await response.json();
}

/**
 * Step 2: Initiate USSD-PUSH Request
 * Sends the USSD-PUSH request to customer's mobile device
 */
async function initiatePayment(token: string, payload: PaymentRequest) {
  console.log("Initiating ClickPesa USSD-PUSH payment...", { 
    amount: payload.amount, 
    network: payload.network,
    reference: payload.reference 
  });

  const response = await fetch("https://api.clickpesa.com/third-parties/ussd-push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token,
    },
    body: JSON.stringify({
      amount: payload.amount,
      currency: payload.currency || "TZS",
      phone_number: payload.phone_number,
      network: payload.network,
      reference: payload.reference,
      description: payload.description,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("ClickPesa payment initiation error:", error);
    throw new Error(`Payment initiation failed: ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      }
    });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header for payment request");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Invalid token or user not found:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Payment request from authenticated user: ${user.id}`);

    const { action, ...payload } = await req.json();

    console.log("ClickPesa payment action:", action);

    switch (action) {
      case "validate": {
        // Step 1: Validate payment details (Preview USSD-PUSH Request)
        try {
          // Validate required fields
          if (!payload.amount || !payload.phone_number || !payload.network || !payload.reference) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "Missing required payment fields: amount, phone_number, network, or reference" 
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const clickpesaToken = await getAuthToken();
          const result = await validatePayment(clickpesaToken, payload as PaymentRequest);
          
          return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (validationError: unknown) {
          const errorMessage = validationError instanceof Error ? validationError.message : "Unknown validation error";
          console.error("Payment validation error:", errorMessage);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: errorMessage,
              details: validationError instanceof Error ? validationError.stack : undefined
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case "initiate": {
        // Step 2: Initiate USSD-PUSH Request
        try {
          // Validate required fields
          if (!payload.amount || !payload.phone_number || !payload.network || !payload.reference) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "Missing required payment fields: amount, phone_number, network, or reference" 
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const clickpesaToken = await getAuthToken();
          
          // First validate, then initiate
          try {
            await validatePayment(clickpesaToken, payload as PaymentRequest);
            console.log("Payment validation successful, proceeding with initiation...");
          } catch (validationError) {
            console.warn("Validation failed, but proceeding with initiation:", validationError);
            // Some implementations may skip validation, so we continue
          }
          
          const result = await initiatePayment(clickpesaToken, payload as PaymentRequest);
          
          // Store the transaction in the database (non-blocking)
          try {
            const { error: txError } = await supabase
              .from("payment_transactions")
              .insert({
                user_id: user.id,
                order_id: payload.order_id || null,
                amount: payload.amount,
                currency: payload.currency || "TZS",
                network: payload.network,
                phone_number: payload.phone_number,
                reference: payload.reference,
                clickpesa_reference: result.transaction_id || result.reference || null,
                status: "pending",
                description: payload.description,
              });

            if (txError) {
              console.error("Error storing transaction (non-critical):", txError);
              // Don't fail the payment if transaction storage fails
            }
          } catch (dbError) {
            console.error("Database error (non-critical):", dbError);
            // Continue even if database insert fails
          }
          
          return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (paymentError: unknown) {
          const errorMessage = paymentError instanceof Error ? paymentError.message : "Unknown payment error";
          console.error("Payment initiation error:", errorMessage);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: errorMessage,
              details: paymentError instanceof Error ? paymentError.stack : undefined
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case "check-status": {
        // Step 3: Check Payment Status
        try {
          const clickpesaToken = await getAuthToken();
          const { transaction_id, reference } = payload;

          if (!transaction_id && !reference) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "Missing required field: transaction_id or reference" 
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Use transaction_id if provided, otherwise try to find it from reference
          let transactionId = transaction_id;
          if (!transactionId && reference) {
            const { data: txData } = await supabase
              .from("payment_transactions")
              .select("clickpesa_reference")
              .eq("reference", reference)
              .eq("user_id", user.id)
              .single();
            
            if (txData?.clickpesa_reference) {
              transactionId = txData.clickpesa_reference;
            }
          }

          if (!transactionId) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "Transaction ID not found" 
              }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const response = await fetch(
            `https://api.clickpesa.com/third-parties/transactions/${transactionId}`,
            {
              headers: {
                "Authorization": clickpesaToken,
              },
            }
          );

          if (!response.ok) {
            const error = await response.text();
            console.error("ClickPesa status check error:", error);
            throw new Error(`Failed to check payment status: ${error}`);
          }

          const result = await response.json();
          
          // Update transaction status in database if reference provided
          if (reference && result.status) {
            const newStatus = result.status === "COMPLETED" ? "completed" 
              : result.status === "FAILED" ? "failed" 
              : result.status === "CANCELLED" ? "cancelled" 
              : "processing";

            const { error: updateError } = await supabase
              .from("payment_transactions")
              .update({ 
                status: newStatus,
                clickpesa_reference: transactionId,
              })
              .eq("reference", reference)
              .eq("user_id", user.id);

            if (updateError) {
              console.error("Error updating transaction status:", updateError);
            }

            // If payment completed, update order status
            if (newStatus === "completed") {
              const { data: txData } = await supabase
                .from("payment_transactions")
                .select("order_id")
                .eq("reference", reference)
                .single();

              if (txData?.order_id) {
                await supabase
                  .from("orders")
                  .update({ status: "confirmed" })
                  .eq("id", txData.order_id);
              }
            }
          }

          return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (statusError: unknown) {
          const errorMessage = statusError instanceof Error ? statusError.message : "Unknown status check error";
          console.error("Payment status check error:", errorMessage);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: errorMessage,
              details: statusError instanceof Error ? statusError.stack : undefined
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("ClickPesa payment error:", errorMessage, errorStack);
    
    // Check for specific error types
    let statusCode = 500;
    if (errorMessage.includes("credentials not configured") || errorMessage.includes("Unauthorized")) {
      statusCode = 401;
    } else if (errorMessage.includes("Missing required") || errorMessage.includes("Invalid")) {
      statusCode = 400;
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        // Only include stack in development
        ...(Deno.env.get("ENVIRONMENT") === "development" ? { stack: errorStack } : {})
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
