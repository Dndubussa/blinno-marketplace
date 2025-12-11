import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  orderId: string;
  buyerEmail: string;
  buyerName?: string;
}

const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Order confirmation function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, buyerEmail, buyerName }: OrderConfirmationRequest = await req.json();

    console.log(`Processing order confirmation for order ${orderId}`);

    if (!orderId || !buyerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: orderId, buyerEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) {
      console.error("Error fetching order:", orderError);
      throw orderError;
    }

    // Fetch order items with products
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        products:product_id (title, price, images)
      `)
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
    }

    // Build order items HTML
    let itemsHtml = "";
    if (orderItems && orderItems.length > 0) {
      itemsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
          </tr>
          ${orderItems.map((item: any) => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${item.products?.title || "Product"}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${item.quantity}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">${formatPrice(item.price_at_purchase * item.quantity)}</td>
            </tr>
          `).join("")}
          <tr style="font-weight: bold; background-color: #f8f9fa;">
            <td colspan="2" style="padding: 12px; text-align: right;">Subtotal:</td>
            <td style="padding: 12px; text-align: right;">${formatPrice(order.total_amount)}</td>
          </tr>
          <tr style="font-weight: bold; font-size: 18px;">
            <td colspan="2" style="padding: 12px; text-align: right; color: #14b8a6;">Total:</td>
            <td style="padding: 12px; text-align: right; color: #14b8a6;">${formatPrice(order.total_amount)}</td>
          </tr>
        </table>
      `;
    }

    const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 48px;">🎉</span>
              <h2 style="color: #111827; margin: 16px 0 8px 0;">Thank You for Your Order!</h2>
            </div>
            
            <p style="margin-bottom: 20px;">Hi ${buyerName || "there"},</p>
            
            <p style="margin-bottom: 20px;">
              We're excited to confirm your order! We've received your purchase and are getting everything ready.
            </p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #166534;"><strong>Order Number:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
              <p style="margin: 0; color: #166534;"><strong>Order Date:</strong> ${orderDate}</p>
            </div>
            
            <h3 style="color: #111827; margin-top: 30px;">Order Summary</h3>
            ${itemsHtml}
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 12px 0; color: #111827;">What's Next?</h4>
              <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                <li style="margin-bottom: 8px;">We'll send you an email when your order ships</li>
                <li style="margin-bottom: 8px;">You can track your order status in your account</li>
                <li>Estimated delivery: 3-5 business days</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Questions about your order? Reply to this email or contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              &copy; ${new Date().getFullYear()} Blinno. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    console.log(`Sending order confirmation to ${buyerEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Blinno Orders <order@blinno.app>",
      to: [buyerEmail],
      subject: `🎉 Order Confirmed! #${orderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    });

    console.log("Order confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in order-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);