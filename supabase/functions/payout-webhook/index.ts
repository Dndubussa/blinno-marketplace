import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("CLICKPESA_WEBHOOK_SECRET");

interface ClickPesaPayoutCallback {
  transaction_id: string;
  reference: string;
  status: "INITIATED" | "COMPLETED" | "FAILED" | "REFUNDED" | "REVERSED";
  amount: number;
  currency: string;
  phone_number: string;
  network: string;
  message?: string;
  timestamp?: string;
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
    const payload: ClickPesaPayoutCallback = JSON.parse(rawBody);
    
    console.log("ClickPesa payout webhook received:", JSON.stringify(payload, null, 2));

    // 1. HMAC Signature Verification
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
      console.error("Invalid payout webhook payload - missing reference or status");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Find existing withdrawal request
    let withdrawalData = null;
    
    // Try by clickpesa_reference first
    const { data: byClickpesaRef, error: err1 } = await supabase
      .from("withdrawal_requests")
      .select("id, seller_id, amount, status, net_amount")
      .eq("clickpesa_reference", payload.reference)
      .maybeSingle();
    
    if (byClickpesaRef) {
      withdrawalData = byClickpesaRef;
    } else {
      // Try by internal ID
      const { data: byInternalRef, error: err2 } = await supabase
        .from("withdrawal_requests")
        .select("id, seller_id, amount, status, net_amount")
        .eq("id", payload.reference)
        .maybeSingle();
      
      if (byInternalRef) {
        withdrawalData = byInternalRef;
      }
    }

    if (!withdrawalData) {
      console.error("Withdrawal request not found for reference:", payload.reference);
      return new Response(
        JSON.stringify({ success: false, error: "Withdrawal request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Amount validation
    const expectedAmount = Number(withdrawalData.net_amount) || Number(withdrawalData.amount);
    const amountDifference = Math.abs(expectedAmount - Number(payload.amount));
    const amountTolerance = 1;
    if (amountDifference > amountTolerance) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${payload.amount}`);
      return new Response(
        JSON.stringify({ success: false, error: "Amount mismatch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Prevent duplicate processing
    if (withdrawalData.status === "completed") {
      console.log("Withdrawal already completed, skipping");
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map status
    const statusMap: Record<string, string> = {
      INITIATED: "processing",
      COMPLETED: "completed",
      FAILED: "failed",
      REFUNDED: "refunded",
      REVERSED: "reversed",
    };
    const newStatus = statusMap[payload.status] || "processing";

    // Update the withdrawal request
    const { error: updateError } = await supabase
      .from("withdrawal_requests")
      .update({
        status: newStatus,
        clickpesa_reference: payload.transaction_id,
        error_message: ["FAILED", "REFUNDED", "REVERSED"].includes(payload.status) 
          ? payload.message 
          : null,
        processed_at: ["COMPLETED", "FAILED", "REFUNDED", "REVERSED"].includes(payload.status) 
          ? new Date().toISOString() 
          : null,
      })
      .eq("id", withdrawalData.id);

    if (updateError) {
      console.error("Error updating withdrawal request:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Update failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Withdrawal ${withdrawalData.id} updated to status: ${newStatus}`);

    // Send notification email
    if (["COMPLETED", "FAILED", "REFUNDED", "REVERSED"].includes(payload.status)) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/withdrawal-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            withdrawal_id: withdrawalData.id,
            seller_id: withdrawalData.seller_id,
            status: newStatus,
            amount: withdrawalData.amount,
            message: payload.message,
          }),
        });
        console.log("Withdrawal notification sent");
      } catch (emailError) {
        console.error("Error sending withdrawal notification:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Payout webhook processed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("ClickPesa payout webhook error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
