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

interface ShippingRequest {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  buyerEmail: string;
  buyerName?: string;
  estimatedDelivery?: string;
}

const getCarrierTrackingUrl = (carrier: string, trackingNumber: string): string => {
  const carriers: Record<string, string> = {
    ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  };
  return carriers[carrier.toLowerCase()] || "#";
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Shipping notification function called");

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, trackingNumber, carrier, buyerEmail, buyerName, estimatedDelivery }: ShippingRequest = await req.json();

    console.log(`Processing shipping notification for order ${orderId}`);

    if (!orderId || !trackingNumber || !carrier || !buyerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order items
    const { data: orderItems } = await supabase
      .from("order_items")
      .select(`
        *,
        products:product_id (title, images)
      `)
      .eq("order_id", orderId);

    const trackingUrl = getCarrierTrackingUrl(carrier, trackingNumber);

    // Build items HTML
    let itemsHtml = "";
    if (orderItems && orderItems.length > 0) {
      itemsHtml = `
        <div style="margin: 20px 0;">
          <h3 style="color: #111827; margin-bottom: 12px;">Items in Your Shipment</h3>
          ${orderItems.map((item: any) => `
            <div style="display: flex; align-items: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px;">
              <div>
                <p style="font-weight: 500; margin: 0;">${item.products?.title || "Product"}</p>
                <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Qty: ${item.quantity}</p>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Your Order Has Shipped!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 48px;">📦</span>
              <h2 style="color: #111827; margin: 16px 0 8px 0;">On Its Way!</h2>
            </div>
            
            <p style="margin-bottom: 20px;">Hi ${buyerName || "there"},</p>
            
            <p style="margin-bottom: 20px;">
              Great news! Your order has been shipped and is on its way to you.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> ${orderId.slice(0, 8)}...</p>
              <p style="margin: 0 0 8px 0;"><strong>Carrier:</strong> ${carrier.toUpperCase()}</p>
              <p style="margin: 0 0 8px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
              ${estimatedDelivery ? `<p style="margin: 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ""}
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold;">
                Track Your Package
              </a>
            </div>
            
            ${itemsHtml}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              &copy; ${new Date().getFullYear()} Blinno. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Blinno Shipping <shipping@blinno.app>",
      to: [buyerEmail],
      subject: `📦 Your Order Has Shipped! Track: ${trackingNumber}`,
      html: emailHtml,
    });

    console.log("Shipping notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in shipping-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);