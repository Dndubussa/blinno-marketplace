import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const getCorsHeaders = (origin?: string | null) => {
  const allowedOrigins = [
    "https://www.blinno.app",
    "https://blinno.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0]; // Default to production origin
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
};

interface SecurityAlertRequest {
  email: string;
  alertType: "login" | "password_change" | "suspicious_activity" | "new_device";
  userName?: string;
  ipAddress?: string;
  location?: string;
  deviceInfo?: string;
  timestamp?: string;
}

const getAlertContent = (alertType: string, userName: string): { subject: string; title: string; message: string; emoji: string; actionRequired: boolean } => {
  const alerts: Record<string, { subject: string; title: string; message: string; emoji: string; actionRequired: boolean }> = {
    login: {
      subject: "New Login to Your Blinno Account",
      title: "New Sign-In Detected",
      message: "We noticed a new sign-in to your Blinno account.",
      emoji: "🔐",
      actionRequired: false,
    },
    password_change: {
      subject: "Your Blinno Password Was Changed",
      title: "Password Changed Successfully",
      message: "Your account password has been successfully changed.",
      emoji: "🔑",
      actionRequired: false,
    },
    suspicious_activity: {
      subject: "⚠️ Suspicious Activity on Your Blinno Account",
      title: "Suspicious Activity Detected",
      message: "We've detected unusual activity on your account that requires your attention.",
      emoji: "⚠️",
      actionRequired: true,
    },
    new_device: {
      subject: "New Device Added to Your Blinno Account",
      title: "New Device Detected",
      message: "A new device has been used to access your Blinno account.",
      emoji: "📱",
      actionRequired: false,
    },
  };

  return alerts[alertType] || {
    subject: "Security Alert - Blinno",
    title: "Security Notice",
    message: "There has been activity on your account.",
    emoji: "🔔",
    actionRequired: false,
  };
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests FIRST - absolutely before anything else
  if (req.method === "OPTIONS") {
    try {
      const origin = req.headers.get("origin");
      const corsHeaders = getCorsHeaders(origin);
      return new Response(null, { 
        status: 204,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        }
      });
    } catch (error) {
      // Even if there's an error, return 204 for OPTIONS
      console.error("Error in OPTIONS handler:", error);
      return new Response(null, { 
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        }
      });
    }
  }

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { email, alertType, userName, ipAddress, location, deviceInfo, timestamp }: SecurityAlertRequest = await req.json();

    console.log(`Processing security alert: ${alertType} for ${email}`);

    if (!email || !alertType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, alertType" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    const alertContent = getAlertContent(alertType, userName || "User");
    const displayTime = timestamp || new Date().toLocaleString("en-US", { 
      dateStyle: "full", 
      timeStyle: "short" 
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Blinno Security</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 48px;">${alertContent.emoji}</span>
              <h2 style="color: #111827; margin: 16px 0 8px 0;">${alertContent.title}</h2>
            </div>
            
            <p style="margin-bottom: 20px;">Hi ${userName || "there"},</p>
            
            <p style="margin-bottom: 20px;">${alertContent.message}</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${displayTime}</p>
              ${ipAddress ? `<p style="margin: 0 0 8px 0;"><strong>IP Address:</strong> ${ipAddress}</p>` : ""}
              ${location ? `<p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${location}</p>` : ""}
              ${deviceInfo ? `<p style="margin: 0;"><strong>Device:</strong> ${deviceInfo}</p>` : ""}
            </div>
            
            ${alertContent.actionRequired ? `
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #dc2626; font-weight: bold; margin: 0 0 8px 0;">⚠️ Action Required</p>
                <p style="color: #7f1d1d; margin: 0;">If you don't recognize this activity, please change your password immediately and contact our support team.</p>
              </div>
            ` : `
              <p style="color: #6b7280; font-size: 14px;">
                If this was you, no further action is needed. If you didn't perform this action, please secure your account immediately.
              </p>
            `}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This is an automated security notification from Blinno.<br>
              &copy; ${new Date().getFullYear()} Blinno. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Blinno Security <security@blinno.app>",
      to: [email],
      subject: alertContent.subject,
      html: emailHtml,
    });

    console.log("Security alert email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error: any) {
    console.error("Error in security-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
