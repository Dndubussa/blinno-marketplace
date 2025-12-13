import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("FLUTTERWAVE_WEBHOOK_SECRET");

interface FlutterwaveWebhook {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    card?: any;
    created_at: string;
    status: string;
    payment_type: string;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    account?: any;
    meta?: any;
  };
}

// Verify Flutterwave webhook signature using HMAC SHA256
// Flutterwave sends the signature in the 'verifhash' header
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  if (!secret) {
    console.warn("FLUTTERWAVE_WEBHOOK_SECRET not set - skipping signature verification");
    return true; // Allow if secret not configured (for development)
  }

  if (!signature) {
    console.error("Missing webhook signature");
    return false;
  }

  try {
    // Flutterwave uses HMAC SHA256 for webhook verification
    // The signature is a hex-encoded HMAC SHA256 hash
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(payload);

    // Import the secret key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Generate HMAC signature
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Compare signatures (case-insensitive as Flutterwave may send uppercase)
    const isValid = hashHex.toLowerCase() === signature.toLowerCase();
    
    if (!isValid) {
      console.error("Signature mismatch:", {
        expected: hashHex,
        received: signature,
      });
    }

    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const rawBody = await req.text();
    const payload: FlutterwaveWebhook = JSON.parse(rawBody);

    console.log("Flutterwave webhook received:", JSON.stringify(payload, null, 2));

    // Verify webhook signature
    // Flutterwave sends the signature in the 'verifhash' header
    const signature = req.headers.get("verifhash") || 
                      req.headers.get("x-flutterwave-signature") ||
                      req.headers.get("X-Flutterwave-Signature");
    
    if (webhookSecret) {
      if (!signature) {
        console.error("Webhook secret configured but no signature provided");
        return new Response(
          JSON.stringify({ success: false, error: "Missing signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValid = await verifySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("Invalid webhook signature - potential security threat");
        return new Response(
          JSON.stringify({ success: false, error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Webhook signature verified successfully");
    } else {
      console.warn("FLUTTERWAVE_WEBHOOK_SECRET not configured - webhook signature verification disabled");
    }

    // Validate required fields
    if (!payload.data?.tx_ref || !payload.data?.status) {
      console.error("Invalid webhook payload - missing tx_ref or status");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reference = payload.data.tx_ref;
    const status = payload.data.status.toLowerCase();

    // Find existing transaction
    const { data: existingTx, error: txFetchError } = await supabase
      .from("payment_transactions")
      .select("id, amount, status, order_id, user_id, subscription_id")
      .eq("reference", reference)
      .single();

    if (txFetchError || !existingTx) {
      console.error("Transaction not found for reference:", reference);
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Amount validation
    const amountDifference = Math.abs(Number(existingTx.amount) - Number(payload.data.amount));
    const amountTolerance = 1;
    if (amountDifference > amountTolerance) {
      console.error(`Amount mismatch: expected ${existingTx.amount}, got ${payload.data.amount}`);
      return new Response(
        JSON.stringify({ success: false, error: "Amount mismatch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent duplicate processing
    if (existingTx.status === "completed") {
      console.log("Transaction already completed, skipping");
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map Flutterwave status to our status
    const statusMap: Record<string, string> = {
      successful: "completed",
      completed: "completed",
      failed: "failed",
      cancelled: "cancelled",
      pending: "pending",
    };

    const newStatus = statusMap[status] || "processing";

    console.log(`Processing webhook: status=${status}, mapped to: ${newStatus}`);

    // Update the payment transaction
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: newStatus,
        clickpesa_reference: payload.data.flw_ref || String(payload.data.id), // Keep field name for compatibility
        error_message: status === "failed" ? payload.data.processor_response : null,
      })
      .eq("reference", reference);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Update failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Transaction ${reference} updated to status: ${newStatus}`);

    // If payment completed, process order and earnings
    if (newStatus === "completed") {
      // Send receipt email
      try {
        const receiptResponse = await fetch(`${supabaseUrl}/functions/v1/payment-receipt-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            transaction_id: payload.data.flw_ref || String(payload.data.id),
            user_id: existingTx.user_id,
          }),
        });

        if (!receiptResponse.ok) {
          console.error("Failed to send receipt email:", await receiptResponse.text());
        } else {
          console.log("Receipt email triggered successfully");
        }
      } catch (emailError) {
        console.error("Error triggering receipt email:", emailError);
      }

      // Handle subscription payment
      if (existingTx.subscription_id) {
        const { error: subError } = await supabase
          .from("seller_subscriptions")
          .update({
            status: "active",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            payment_reference: payload.data.flw_ref || String(payload.data.id),
          })
          .eq("id", existingTx.subscription_id);

        if (subError) {
          console.error("Error updating subscription:", subError);
        } else {
          console.log(`Subscription ${existingTx.subscription_id} activated after successful payment`);
        }
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
              const { data: commissionRate, error: commissionError } = await supabase.rpc(
                "get_seller_commission_rate",
                { p_seller_id: item.seller_id }
              );

              if (commissionError) {
                console.error(`Error getting commission rate for seller ${item.seller_id}:`, commissionError);
              }

              const platformFeeRate = typeof commissionRate === "number" ? commissionRate : 0.05;
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
                status: "completed",
              };
            })
          );

          const { error: earningsError } = await supabase.from("seller_earnings").insert(earningsToInsert);

          if (earningsError) {
            console.error("Error creating seller earnings:", earningsError);
          } else {
            console.log(`Created earnings for ${earningsToInsert.length} seller(s) with plan-based commission rates`);
          }
        }
      }
    }

    // If payment failed, update order or subscription
    if (newStatus === "failed") {
      if (existingTx.order_id) {
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

      if (existingTx.subscription_id) {
        const { error: subError } = await supabase
          .from("seller_subscriptions")
          .update({ status: "active" }) // Keep current plan if payment fails
          .eq("id", existingTx.subscription_id);

        if (subError) {
          console.error("Error updating subscription after failed payment:", subError);
        } else {
          console.log(`Subscription ${existingTx.subscription_id} kept at current plan after failed payment`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Flutterwave webhook error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

