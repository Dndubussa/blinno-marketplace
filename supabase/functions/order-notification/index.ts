import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderStatusRequest {
  orderId: string;
  newStatus: string;
  buyerEmail: string;
  buyerName?: string;
}

const getStatusMessage = (status: string): { subject: string; message: string; emoji: string } => {
  const statusMessages: Record<string, { subject: string; message: string; emoji: string }> = {
    pending: {
      subject: "Order Received",
      message: "We've received your order and are processing it.",
      emoji: "📋",
    },
    processing: {
      subject: "Order Being Prepared",
      message: "Great news! Your order is now being prepared for shipment.",
      emoji: "⚙️",
    },
    shipped: {
      subject: "Order Shipped",
      message: "Your order has been shipped and is on its way to you!",
      emoji: "📦",
    },
    delivered: {
      subject: "Order Delivered",
      message: "Your order has been delivered. Enjoy your purchase!",
      emoji: "✅",
    },
    cancelled: {
      subject: "Order Cancelled",
      message: "Your order has been cancelled. If you have any questions, please contact support.",
      emoji: "❌",
    },
  };

  return statusMessages[status] || {
    subject: "Order Status Update",
    message: `Your order status has been updated to: ${status}`,
    emoji: "📬",
  };
};

const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Order notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, newStatus, buyerEmail, buyerName }: OrderStatusRequest = await req.json();

    console.log(`Processing order notification for order ${orderId}, status: ${newStatus}`);

    if (!orderId || !newStatus || !buyerEmail) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: orderId, newStatus, buyerEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client to fetch order details
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
    }

    // Fetch order items
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

    const statusInfo = getStatusMessage(newStatus);
    const customerName = buyerName || "Valued Customer";

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
          <tr style="font-weight: bold;">
            <td colspan="2" style="padding: 12px; text-align: right;">Total:</td>
            <td style="padding: 12px; text-align: right;">${formatPrice(order?.total_amount || 0)}</td>
          </tr>
        </table>
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
            <h1 style="color: white; margin: 0; font-size: 28px;">Blinno</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 48px;">${statusInfo.emoji}</span>
              <h2 style="color: #111827; margin: 16px 0 8px 0;">${statusInfo.subject}</h2>
            </div>
            
            <p style="margin-bottom: 20px;">Hi ${customerName},</p>
            
            <p style="margin-bottom: 20px;">${statusInfo.message}</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> ${orderId.slice(0, 8)}...</p>
              <p style="margin: 0;"><strong>Status:</strong> <span style="color: #14b8a6; font-weight: bold;">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></p>
            </div>
            
            ${itemsHtml}
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you have any questions about your order, please don't hesitate to contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              &copy; ${new Date().getFullYear()} Blinno. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    console.log(`Sending email to ${buyerEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Blinno Orders <order@blinno.app>",
      to: [buyerEmail],
      subject: `${statusInfo.emoji} ${statusInfo.subject} - Order #${orderId.slice(0, 8)}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in order-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
