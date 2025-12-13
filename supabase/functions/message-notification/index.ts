import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS configuration with origin validation
const ALLOWED_ORIGINS = [
  "https://www.blinno.app",
  "https://blinno.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(origin?: string | null, methods: string = "POST, OPTIONS"): Record<string, string> {
  let allowedOrigin = ALLOWED_ORIGINS[0];
  if (origin && typeof origin === "string") {
    const normalizedOrigin = origin.trim().toLowerCase();
    const isAllowed = ALLOWED_ORIGINS.some((allowed) => allowed.toLowerCase() === normalizedOrigin);
    if (isAllowed) allowedOrigin = origin;
  }
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Max-Age": "86400",
  };
}
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface MessageNotificationRequest {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
}

// Rate limiting per sender to prevent spam
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 10; // 10 message notifications per minute per sender

function isRateLimited(senderId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(senderId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(senderId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= MAX_MESSAGES_PER_WINDOW) {
    return true;
  }

  record.count++;
  return false;
}

// Clean up old entries periodically
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message_id, sender_id, receiver_id, content }: MessageNotificationRequest = await req.json();

    console.log(`Processing message notification for message ${message_id}`);

    // Check rate limit for sender
    if (isRateLimited(sender_id)) {
      console.log(`Rate limited message notifications for sender: ${sender_id}`);
      return new Response(
        JSON.stringify({ success: false, error: "Rate limit exceeded" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Cleanup old entries occasionally
    if (Math.random() < 0.1) {
      cleanupRateLimitMap();
    }

    // Get sender's profile
    const { data: senderProfile, error: senderError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", sender_id)
      .single();

    if (senderError) {
      console.error("Error fetching sender profile:", senderError);
      throw new Error("Sender not found");
    }

    // Get receiver's profile
    const { data: receiverProfile, error: receiverError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", receiver_id)
      .single();

    if (receiverError || !receiverProfile?.email) {
      console.error("Error fetching receiver profile:", receiverError);
      throw new Error("Receiver not found or no email");
    }

    const senderName = senderProfile?.full_name || "Someone";
    const receiverName = receiverProfile?.full_name || "there";
    const previewContent = content.length > 100 ? content.substring(0, 100) + "..." : content;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #1BA94C 0%, #2196F3 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">BLINNO</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">New Message</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="width: 60px; height: 60px; background-color: #e0f2fe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                        <span style="font-size: 28px;">💬</span>
                      </div>
                      <h2 style="color: #333333; margin: 0 0 8px;">You have a new message!</h2>
                    </div>
                    
                    <p style="color: #333333; line-height: 1.6; margin-bottom: 16px;">
                      Hi ${receiverName},
                    </p>
                    
                    <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">
                      <strong>${senderName}</strong> sent you a message on Blinno:
                    </p>
                    
                    <div style="background-color: #f8fafc; border-left: 4px solid #1BA94C; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                      <p style="color: #333333; margin: 0; font-style: italic; line-height: 1.6;">
                        "${previewContent}"
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://www.blinno.app/buyer/messages" style="display: inline-block; background-color: #1BA94C; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                        View Message
                      </a>
                    </div>
                    
                    <p style="color: #999999; font-size: 12px; margin-top: 30px; text-align: center;">
                      You're receiving this because you have a conversation on Blinno.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                    <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">Questions? Contact support@blinno.app</p>
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

    const emailResponse = await resend.emails.send({
      from: "Blinno <noreply@blinno.app>",
      to: [receiverProfile.email],
      subject: `New message from ${senderName} on Blinno`,
      html: emailHtml,
    });

    console.log("Message notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in message-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
