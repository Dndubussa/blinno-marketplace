import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("CLICKPESA_WEBHOOK_SECRET");

interface ClickPesaCallback {
  transaction_id: string;
  reference: string;
  status: "COMPLETED" | "FAILED" | "CANCELLED" | "PENDING" | "PAYMENT_RECEIVED" | "PAYMENT_FAILED";
  amount: number;
  currency: string;
  phone_number: string;
  network: string;
  message?: string;
  timestamp?: string;
  event_type?: "PAYMENT_RECEIVED" | "PAYMENT_FAILED";
  signature?: string;
}

// HMAC signature verification
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature.toLowerCase() === expectedSignature.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const rawBody = await req.text();
    const payload: ClickPesaCallback = JSON.parse(rawBody);
    
    console.log("ClickPesa webhook received:", JSON.stringify(payload, null, 2));

    // 1. HMAC Signature Verification (if webhook secret is configured)
    const incomingSignature = req.headers.get("X-ClickPesa-Signature") || 
                               req.headers.get("x-clickpesa-signature") ||
                               payload.signature;
    
    if (webhookSecret) {
      if (!incomingSignature) {
        console.error("Missing webhook signature");
        return new Response(
          JSON.stringify({ success: false, error: "Missing signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValidSignature = await verifySignature(rawBody, incomingSignature, webhookSecret);
      if (!isValidSignature) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({ success: false, error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Webhook signature verified successfully");
    } else {
      console.warn("CLICKPESA_WEBHOOK_SECRET not set - skipping signature verification");
    }

    // 2. Validate required fields
    if (!payload.reference || !payload.status) {
      console.error("Invalid webhook payload - missing reference or status");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Secondary check: Verify transaction exists and amount matches
    const { data: existingTx, error: txFetchError } = await supabase
      .from("payment_transactions")
      .select("id, amount, status, order_id, user_id")
      .eq("reference", payload.reference)
      .single();

    if (txFetchError || !existingTx) {
      console.error("Transaction not found for reference:", payload.reference);
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Amount validation (allow small tolerance for rounding)
    const amountDifference = Math.abs(Number(existingTx.amount) - Number(payload.amount));
    const amountTolerance = 1; // 1 unit tolerance
    if (amountDifference > amountTolerance) {
      console.error(`Amount mismatch: expected ${existingTx.amount}, got ${payload.amount}`);
      return new Response(
        JSON.stringify({ success: false, error: "Amount mismatch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Prevent duplicate processing
    if (existingTx.status === "completed") {
      console.log("Transaction already completed, skipping");
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map status
    const statusMap: Record<string, string> = {
      COMPLETED: "completed",
      PAYMENT_RECEIVED: "completed",
      FAILED: "failed",
      PAYMENT_FAILED: "failed",
      CANCELLED: "cancelled",
      PENDING: "pending",
    };
    
    const statusToCheck = payload.event_type || payload.status;
    const newStatus = statusMap[statusToCheck] || "processing";
    
    console.log(`Processing webhook: event_type=${payload.event_type}, status=${payload.status}, mapped to: ${newStatus}`);

    // Update the payment transaction
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: newStatus,
        clickpesa_reference: payload.transaction_id,
        error_message: payload.status === "FAILED" ? payload.message : null,
      })
      .eq("reference", payload.reference);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Update failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Transaction ${payload.reference} updated to status: ${newStatus}`);

    // If payment completed, process order and earnings
    if (newStatus === "completed") {
      // Send receipt email
      try {
        const receiptResponse = await fetch(
          `${supabaseUrl}/functions/v1/payment-receipt-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              transaction_id: payload.transaction_id,
              user_id: existingTx.user_id,
            }),
          }
        );
        
        if (!receiptResponse.ok) {
          console.error("Failed to send receipt email:", await receiptResponse.text());
        } else {
          console.log("Receipt email triggered successfully");
        }
      } catch (emailError) {
        console.error("Error triggering receipt email:", emailError);
      }

      // Update order if linked and create seller earnings
      if (existingTx.order_id) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ status: "confirmed" })
          .eq("id", existingTx.order_id);

        if (orderError) {
          console.error("Error updating order:", orderError);
        } else {
          console.log(`Order ${existingTx.order_id} confirmed after successful payment`);
        }

        // Fetch order items to create seller earnings
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("id, seller_id, price_at_purchase, quantity")
          .eq("order_id", existingTx.order_id);

        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
        } else if (orderItems && orderItems.length > 0) {
          // Calculate earnings with plan-based commission rates
          const earningsToInsert = await Promise.all(
            orderItems.map(async (item) => {
              // Get commission rate for this seller's plan
              const { data: commissionRate, error: commissionError } = await supabase
                .rpc('get_seller_commission_rate', { p_seller_id: item.seller_id });

              if (commissionError) {
                console.error(`Error getting commission rate for seller ${item.seller_id}:`, commissionError);
              }

              // Use plan-based rate or default to 5% if error
              // RPC function returns a single numeric value directly
              const platformFeeRate = (typeof commissionRate === 'number' ? commissionRate : 0.05);
              
              const amount = item.price_at_purchase * item.quantity;
              const platformFee = Math.round(amount * platformFeeRate * 100) / 100;
              const netAmount = amount - platformFee;
              
              return {
                seller_id: item.seller_id,
                order_item_id: item.id,
                order_id: existingTx.order_id,
                amount,
                platform_fee: platformFee,
                net_amount: netAmount,
                status: 'completed'
              };
            })
          );

          const { error: earningsError } = await supabase
            .from("seller_earnings")
            .insert(earningsToInsert);

          if (earningsError) {
            console.error("Error creating seller earnings:", earningsError);
          } else {
            console.log(`Created earnings for ${earningsToInsert.length} seller(s) with plan-based commission rates`);
          }
        }
      }
    }

    // If payment failed, update order
    if (newStatus === "failed" && existingTx.order_id) {
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "payment_failed" })
        .eq("id", existingTx.order_id);

      if (orderError) {
        console.error("Error updating order to failed:", orderError);
      } else {
        console.log(`Order ${existingTx.order_id} marked as payment_failed`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("ClickPesa webhook error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
