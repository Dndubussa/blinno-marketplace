import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  verificationUrl: string;
  recipientName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Verification email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, verificationUrl, recipientName = "there" }: VerificationEmailRequest = await req.json();
    
    console.log("Sending verification email to:", email);

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
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #1BA94C 0%, #2196F3 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">BLINNO</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Verify Your Email Address</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="width: 80px; height: 80px; background-color: #e0f2fe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <span style="font-size: 40px;">✉️</span>
                      </div>
                      <h2 style="color: #333333; margin: 0 0 10px;">Almost there!</h2>
                      <p style="color: #666666; margin: 0;">Just one more step to get started.</p>
                    </div>
                    
                    <p style="color: #333333; line-height: 1.6; margin-bottom: 20px;">
                      Hi ${recipientName},
                    </p>
                    
                    <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">
                      Thanks for signing up for Blinno! Please verify your email address to complete your registration and start exploring our marketplace.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${verificationUrl}" style="display: inline-block; background-color: #1BA94C; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Verify Email Address
                      </a>
                    </div>
                    
                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="color: #1BA94C; font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 6px;">
                      ${verificationUrl}
                    </p>
                    
                    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 16px; border-radius: 8px; margin: 20px 0;">
                      <p style="color: #92400e; margin: 0; font-size: 14px;">
                        ⏰ This verification link will expire in 24 hours.
                      </p>
                    </div>
                    
                    <p style="color: #999999; font-size: 12px; margin-top: 30px;">
                      If you didn't create an account on Blinno, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                    <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">Questions? Contact us at support@blinno.app</p>
                    <p style="color: #cccccc; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Blinno Marketplace. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Blinno <noreply@blinno.app>",
        to: [email],
        subject: "Verify your Blinno account",
        html: emailHtml,
        click_tracking: false, // Disable click tracking to prevent redirect chain issues
      }),
    });

    const emailResponse = await res.json();

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
