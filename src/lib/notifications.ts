import { supabase } from "@/integrations/supabase/client";

export interface OrderStatusNotification {
  orderId: string;
  newStatus: string;
  buyerEmail: string;
  buyerName?: string;
}

export interface SecurityAlertNotification {
  email: string;
  alertType: "login" | "password_change" | "suspicious_activity" | "new_device";
  userName?: string;
  ipAddress?: string;
  location?: string;
  deviceInfo?: string;
  timestamp?: string;
}

export interface ShippingNotification {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  buyerEmail: string;
  buyerName?: string;
  estimatedDelivery?: string;
}

export interface OrderConfirmationNotification {
  orderId: string;
  buyerEmail: string;
  buyerName?: string;
}

export interface NewsletterCampaign {
  subject: string;
  htmlContent: string;
  previewText?: string;
}

export interface WithdrawalNotification {
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

export async function sendOrderStatusNotification(data: OrderStatusNotification) {
  try {
    const { data: response, error } = await supabase.functions.invoke("order-notification", {
      body: data,
    });

    if (error) {
      console.error("Failed to send order notification:", error);
      throw error;
    }

    return { success: true, data: response };
  } catch (error) {
    console.error("Error sending order notification:", error);
    return { success: false, error };
  }
}

export async function sendSecurityAlert(data: SecurityAlertNotification) {
  try {
    const { data: response, error } = await supabase.functions.invoke("security-alert", {
      body: data,
    });

    if (error) {
      console.error("Failed to send security alert:", error);
      throw error;
    }

    return { success: true, data: response };
  } catch (error) {
    console.error("Error sending security alert:", error);
    return { success: false, error };
  }
}

export async function sendShippingNotification(data: ShippingNotification) {
  try {
    const { data: response, error } = await supabase.functions.invoke("shipping-notification", {
      body: data,
    });

    if (error) {
      console.error("Failed to send shipping notification:", error);
      throw error;
    }

    return { success: true, data: response };
  } catch (error) {
    console.error("Error sending shipping notification:", error);
    return { success: false, error };
  }
}

export async function sendOrderConfirmation(data: OrderConfirmationNotification) {
  try {
    const { data: response, error } = await supabase.functions.invoke("order-confirmation", {
      body: data,
    });

    if (error) {
      console.error("Failed to send order confirmation:", error);
      throw error;
    }

    return { success: true, data: response };
  } catch (error) {
    console.error("Error sending order confirmation:", error);
    return { success: false, error };
  }
}

export async function sendNewsletterCampaign(data: NewsletterCampaign) {
  try {
    const { data: response, error } = await supabase.functions.invoke("newsletter-campaign", {
      body: data,
    });

    if (error) {
      console.error("Failed to send newsletter campaign:", error);
      throw error;
    }

    return { success: true, data: response };
  } catch (error) {
    console.error("Error sending newsletter campaign:", error);
    return { success: false, error };
  }
}

export async function sendWithdrawalNotification(data: WithdrawalNotification) {
  try {
    const { data: response, error } = await supabase.functions.invoke("withdrawal-notification", {
      body: data,
    });

    if (error) {
      console.error("Failed to send withdrawal notification:", error);
      throw error;
    }

    return { success: true, data: response };
  } catch (error) {
    console.error("Error sending withdrawal notification:", error);
    return { success: false, error };
  }
}