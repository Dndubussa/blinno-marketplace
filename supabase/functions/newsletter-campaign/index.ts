import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterCampaignRequest {
  subject: string;
  htmlContent: string;
  previewText?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Newsletter campaign function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and check admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Invalid token or user not found:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin role
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError || !roles || roles.length === 0) {
      console.error("User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin user ${user.id} is sending newsletter campaign`);

    const { subject, htmlContent, previewText }: NewsletterCampaignRequest = await req.json();

    console.log(`Processing newsletter campaign: ${subject}`);

    if (!subject || !htmlContent) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: subject, htmlContent" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscribers")
      .select("email, name")
      .eq("is_active", true);

    if (subError) {
      console.error("Error fetching subscribers:", subError);
      throw subError;
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active subscribers", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending newsletter to ${subscribers.length} subscribers`);

    // Build the full email HTML with wrapper
    const fullEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${previewText ? `<meta name="x-apple-disable-message-reformatting"><title>${previewText}</title>` : ""}
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>` : ""}
          
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Blinno Newsletter</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            ${htmlContent}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              You're receiving this because you subscribed to the Blinno newsletter.<br>
              &copy; ${new Date().getFullYear()} Blinno. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send to all subscribers (batch sending)
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Send in batches of 50 to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const sendPromises = batch.map(async (subscriber) => {
        try {
          await resend.emails.send({
            from: "Blinno Newsletter <newsletter@blinno.app>",
            to: [subscriber.email],
            subject: subject,
            html: fullEmailHtml.replace("{{name}}", subscriber.name || "there"),
          });
          sentCount++;
        } catch (err: any) {
          failedCount++;
          errors.push(`${subscriber.email}: ${err.message}`);
          console.error(`Failed to send to ${subscriber.email}:`, err);
        }
      });

      await Promise.all(sendPromises);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Newsletter campaign complete. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        total: subscribers.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in newsletter-campaign function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);