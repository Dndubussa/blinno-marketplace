import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

interface NewsletterRequest {
  email: string;
  name?: string;
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute per IP

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
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

const handler = async (req: Request): Promise<Response> => {
  console.log("Newsletter subscribe function called");

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    // Check rate limit
    if (isRateLimited(clientIP)) {
      console.log(`Rate limited request from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cleanup old entries occasionally
    if (Math.random() < 0.1) {
      cleanupRateLimitMap();
    }

    const { email, name }: NewsletterRequest = await req.json();

    console.log(`Processing newsletter subscription for ${email}`);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        return new Response(
          JSON.stringify({ success: true, message: "Already subscribed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Reactivate subscription
        await supabase
          .from("newsletter_subscribers")
          .update({ is_active: true, unsubscribed_at: null })
          .eq("id", existing.id);
      }
    } else {
      // Insert new subscriber
      const { error: insertError } = await supabase
        .from("newsletter_subscribers")
        .insert({ email, name });

      if (insertError) {
        console.error("Error inserting subscriber:", insertError);
        throw insertError;
      }
    }

    // Send welcome email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Blinno!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 48px;">🎉</span>
              <h2 style="color: #111827; margin: 16px 0 8px 0;">You're In!</h2>
            </div>
            
            <p style="margin-bottom: 20px;">Hi ${name || "there"},</p>
            
            <p style="margin-bottom: 20px;">
              Thank you for subscribing to the Blinno newsletter! You're now part of our community and will receive:
            </p>
            
            <ul style="padding-left: 20px; margin-bottom: 20px;">
              <li style="margin-bottom: 8px;">🛍️ Exclusive deals and early access to sales</li>
              <li style="margin-bottom: 8px;">✨ New product announcements</li>
              <li style="margin-bottom: 8px;">📚 Tips and inspiration from our sellers</li>
              <li style="margin-bottom: 8px;">🎁 Special subscriber-only offers</li>
            </ul>
            
            <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="color: white; font-size: 18px; font-weight: bold; margin: 0;">
                Stay tuned for amazing updates!
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              You're receiving this email because you subscribed to the Blinno newsletter.<br>
              &copy; ${new Date().getFullYear()} Blinno. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Blinno Newsletter <newsletter@blinno.app>",
      to: [email],
      subject: "🎉 Welcome to the Blinno Newsletter!",
      html: emailHtml,
    });

    console.log("Welcome email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Successfully subscribed!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in newsletter-subscribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
