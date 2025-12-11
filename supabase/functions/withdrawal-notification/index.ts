import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WithdrawalNotificationRequest {
  email: string;
  sellerName?: string;
  withdrawalId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: "processing" | "completed" | "failed";
  paymentMethod: string;
  errorMessage?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "#22c55e";
    case "processing": return "#f59e0b";
    case "failed": return "#ef4444";
    default: return "#6b7280";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "completed": return "Completed Successfully";
    case "processing": return "Being Processed";
    case "failed": return "Failed";
    default: return status;
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Withdrawal notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: WithdrawalNotificationRequest = await req.json();
    console.log("Processing withdrawal notification:", data.status, "for", data.email);

    const statusColor = getStatusColor(data.status);
    const statusText = getStatusText(data.status);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1BA94C 0%, #2196F3 100%); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Blinno</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Withdrawal Update</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 16px; margin: 0 0 24px 0;">
          Hello${data.sellerName ? ` ${data.sellerName}` : ''},
        </p>
        
        <p style="color: #334155; font-size: 16px; margin: 0 0 24px 0;">
          Your withdrawal request has been updated. Here are the details:
        </p>
        
        <!-- Status Badge -->
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background: ${statusColor}; color: white; padding: 8px 24px; border-radius: 20px; font-weight: 600; font-size: 14px;">
            ${statusText}
          </span>
        </div>
        
        <!-- Details Card -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Withdrawal ID</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right; font-family: monospace;">${data.withdrawalId.slice(0, 8)}...</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount Requested</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right; font-weight: 600;">TZS ${data.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Platform Fee (2%)</td>
              <td style="padding: 8px 0; color: #ef4444; font-size: 14px; text-align: right;">-TZS ${data.fee.toLocaleString()}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 12px 0 8px 0; color: #1e293b; font-size: 16px; font-weight: 600;">Net Amount</td>
              <td style="padding: 12px 0 8px 0; color: #22c55e; font-size: 16px; text-align: right; font-weight: 700;">TZS ${data.netAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment Method</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right; text-transform: uppercase;">${data.paymentMethod}</td>
            </tr>
          </table>
        </div>
        
        ${data.status === "completed" ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #166534; margin: 0; font-size: 14px;">
            ✓ The funds have been successfully sent to your mobile money account. Please check your account balance.
          </p>
        </div>
        ` : ''}
        
        ${data.status === "failed" && data.errorMessage ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #dc2626; margin: 0; font-size: 14px;">
            <strong>Error:</strong> ${data.errorMessage}
          </p>
          <p style="color: #991b1b; margin: 8px 0 0 0; font-size: 13px;">
            Please contact support if you need assistance.
          </p>
        </div>
        ` : ''}
        
        ${data.status === "processing" ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            Your withdrawal is being processed. You will receive another notification once it's completed.
          </p>
        </div>
        ` : ''}
        
        <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
          If you have any questions, please contact our support team.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Blinno. All rights reserved.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0 0;">
          This is an automated notification from the Blinno marketplace.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Blinno Payouts <payouts@blinno.app>",
      to: [data.email],
      subject: `Withdrawal ${statusText} - TZS ${data.netAmount.toLocaleString()}`,
      html: emailHtml,
    });

    console.log("Withdrawal notification email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in withdrawal-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
