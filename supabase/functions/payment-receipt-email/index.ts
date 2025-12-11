import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReceiptRequest {
  transaction_id: string;
  user_id: string;
}

const networkNames: Record<string, string> = {
  MPESA: "M-Pesa (Vodacom)",
  TIGOPESA: "Tigo Pesa",
  AIRTELMONEY: "Airtel Money",
  HALOPESA: "Halopesa",
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transaction_id, user_id }: PaymentReceiptRequest = await req.json();

    console.log(`Sending payment receipt email for transaction: ${transaction_id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch transaction details
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", transaction_id)
      .single();

    if (txError || !transaction) {
      console.error("Transaction not found:", txError);
      throw new Error("Transaction not found");
    }

    // Fetch user profile for email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error("User profile/email not found:", profileError);
      throw new Error("User email not found");
    }

    const networkName = networkNames[transaction.network] || transaction.network;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1BA94C 0%, #2196F3 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">BLINNO</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Payment Receipt</p>
                  </td>
                </tr>
                
                <!-- Success Icon -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center;">
                    <div style="width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">✓</span>
                    </div>
                    <h2 style="color: #1BA94C; margin: 20px 0 10px; font-size: 24px;">Payment Successful!</h2>
                    <p style="color: #666666; margin: 0; font-size: 16px;">Your payment has been processed successfully.</p>
                  </td>
                </tr>

                <!-- Amount -->
                <tr>
                  <td style="padding: 20px 40px;">
                    <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; text-align: center;">
                      <p style="color: #666666; margin: 0 0 8px; font-size: 14px;">Amount Paid</p>
                      <p style="color: #1BA94C; margin: 0; font-size: 36px; font-weight: bold;">${formatAmount(transaction.amount, transaction.currency)}</p>
                    </div>
                  </td>
                </tr>

                <!-- Transaction Details -->
                <tr>
                  <td style="padding: 20px 40px;">
                    <h3 style="color: #333333; margin: 0 0 16px; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Transaction Details</h3>
                    <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px;">
                      <tr>
                        <td style="color: #666666; padding: 8px 0;">Reference</td>
                        <td style="color: #333333; font-weight: 500; text-align: right; font-family: monospace;">${transaction.reference}</td>
                      </tr>
                      <tr style="background-color: #f8fafc;">
                        <td style="color: #666666; padding: 8px;">Payment Network</td>
                        <td style="color: #333333; font-weight: 500; text-align: right; padding: 8px;">${networkName}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; padding: 8px 0;">Phone Number</td>
                        <td style="color: #333333; font-weight: 500; text-align: right;">${transaction.phone_number}</td>
                      </tr>
                      <tr style="background-color: #f8fafc;">
                        <td style="color: #666666; padding: 8px;">Date & Time</td>
                        <td style="color: #333333; font-weight: 500; text-align: right; padding: 8px;">${formatDate(transaction.created_at)}</td>
                      </tr>
                      ${transaction.description ? `
                      <tr>
                        <td style="color: #666666; padding: 8px 0;">Description</td>
                        <td style="color: #333333; font-weight: 500; text-align: right;">${transaction.description}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td style="padding: 20px 40px; text-align: center;">
                    <a href="https://www.blinno.app/buyer/payments" style="display: inline-block; background-color: #1BA94C; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Transaction History</a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                    <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">This is an automated receipt for your records.</p>
                    <p style="color: #999999; margin: 0; font-size: 12px;">
                      Questions? Contact us at <a href="mailto:support@blinno.app" style="color: #1BA94C;">support@blinno.app</a>
                    </p>
                    <p style="color: #cccccc; margin: 20px 0 0; font-size: 11px;">© ${new Date().getFullYear()} Blinno Marketplace. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Blinno Payments <order@blinno.app>",
      to: [profile.email],
      subject: `Payment Receipt - ${formatAmount(transaction.amount, transaction.currency)}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Failed to send email:", emailError);
      throw emailError;
    }

    console.log("Payment receipt email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "Receipt email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending payment receipt:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
