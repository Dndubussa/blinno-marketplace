import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

interface PaymentRequest {
  amount: number;
  currency: string;
  phone_number: string;
  network: "MPESA" | "TIGOPESA" | "AIRTELMONEY" | "HALOPESA";
  reference: string;
  description: string;
  order_id?: string;
  email?: string;
  name?: string;
}

// Flutterwave API configuration
const FLUTTERWAVE_BASE_URL = Deno.env.get("FLUTTERWAVE_BASE_URL") || "https://api.flutterwave.com/v3";
const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");

// Map our network names to Flutterwave's network codes
const NETWORK_MAP: Record<string, string> = {
  MPESA: "mpesa",
  TIGOPESA: "tigopesa",
  AIRTELMONEY: "airtelmoney",
  HALOPESA: "halopesa",
};

/**
 * Initiate Flutterwave Mobile Money Payment
 * Flutterwave supports mobile money payments via their Charge API
 */
async function initiatePayment(payload: PaymentRequest) {
  console.log("Initiating Flutterwave mobile money payment...", {
    amount: payload.amount,
    network: payload.network,
    reference: payload.reference,
  });

  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error("Flutterwave secret key not configured. Please set FLUTTERWAVE_SECRET_KEY environment variable.");
  }

  // Map network to Flutterwave format
  const flutterwaveNetwork = NETWORK_MAP[payload.network] || payload.network.toLowerCase();

  // Format phone number for Flutterwave (should be in international format: 255XXXXXXXXX)
  let formattedPhone = payload.phone_number.replace(/\D/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "255" + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith("+255")) {
    formattedPhone = formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith("255")) {
    formattedPhone = "255" + formattedPhone;
  }

  // Flutterwave Charge API payload for mobile money
  const chargePayload = {
    tx_ref: payload.reference,
    amount: payload.amount,
    currency: payload.currency || "TZS",
    payment_type: "mobilemoney",
    network: flutterwaveNetwork,
    phone_number: formattedPhone,
    email: payload.email || "customer@blinno.app",
    fullname: payload.name || "Blinno Customer",
    meta: {
      order_id: payload.order_id || null,
      description: payload.description,
    },
  };

  console.log("Flutterwave charge payload:", JSON.stringify(chargePayload, null, 2));

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/charges?type=mobile_money_tanzania`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
    },
    body: JSON.stringify(chargePayload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Flutterwave payment initiation error:", error);
    throw new Error(`Payment initiation failed: ${error}`);
  }

  const result = await response.json();
  console.log("Flutterwave payment response:", JSON.stringify(result, null, 2));

  // Flutterwave returns status in result.status
  if (result.status === "success") {
    return {
      success: true,
      transaction_id: result.data?.id || result.data?.tx_ref || payload.reference,
      reference: result.data?.tx_ref || payload.reference,
      status: result.data?.status || "pending",
      message: result.message || "Payment initiated successfully",
      data: result.data,
    };
  } else {
    throw new Error(result.message || "Payment initiation failed");
  }
}

/**
 * Initiate Flutterwave Hosted Checkout
 * Creates a payment link that redirects users to Flutterwave's checkout page
 */
async function initiateCheckout(payload: {
  amount: number;
  currency: string;
  reference: string;
  description: string;
  customer: { email: string; name: string };
  redirect_url: string;
  meta?: Record<string, any>;
}) {
  console.log("Initiating Flutterwave Hosted Checkout...", {
    amount: payload.amount,
    reference: payload.reference,
  });

  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error("Flutterwave secret key not configured. Please set FLUTTERWAVE_SECRET_KEY environment variable.");
  }

  // Flutterwave Payment Links API payload
  const checkoutPayload = {
    tx_ref: payload.reference,
    amount: payload.amount,
    currency: payload.currency || "TZS",
    payment_options: "card,mobilemoney,ussd,banktransfer",
    redirect_url: payload.redirect_url,
    customer: {
      email: payload.customer.email,
      name: payload.customer.name,
    },
    customizations: {
      title: "Blinno Subscription",
      description: payload.description,
      logo: "https://www.blinno.app/logo.png", // Update with actual logo URL
    },
    meta: payload.meta || {},
  };

  console.log("Flutterwave checkout payload:", JSON.stringify(checkoutPayload, null, 2));

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
    },
    body: JSON.stringify(checkoutPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Flutterwave checkout initiation error:", error);
    throw new Error(`Checkout initiation failed: ${error}`);
  }

  const result = await response.json();
  console.log("Flutterwave checkout response:", JSON.stringify(result, null, 2));

  // Flutterwave can return different response structures
  // Check for both 'success' status and 'data.link' or 'data.link' directly
  if (result.status === "success" && result.data?.link) {
    return {
      success: true,
      checkout_url: result.data.link,
      reference: result.data.tx_ref || payload.reference,
      transaction_id: result.data.id || null,
      message: "Checkout link created successfully",
    };
  } else if (result.data?.link) {
    // Sometimes Flutterwave returns link without explicit success status
    return {
      success: true,
      checkout_url: result.data.link,
      reference: result.data.tx_ref || payload.reference,
      transaction_id: result.data.id || null,
      message: "Checkout link created successfully",
    };
  } else {
    // Log the full response for debugging
    console.error("Flutterwave checkout failed. Full response:", JSON.stringify(result, null, 2));
    throw new Error(result.message || result.data?.message || "Checkout initiation failed");
  }
}

/**
 * Check Flutterwave Payment Status
 */
async function checkPaymentStatus(transactionId: string) {
  console.log("Checking Flutterwave payment status for:", transactionId);

  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error("Flutterwave secret key not configured");
  }

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Flutterwave status check error:", error);
    throw new Error(`Failed to check payment status: ${error}`);
  }

  const result = await response.json();
  console.log("Flutterwave status response:", JSON.stringify(result, null, 2));

  if (result.status === "success") {
    return {
      success: true,
      transaction_id: result.data?.id,
      reference: result.data?.tx_ref,
      status: result.data?.status,
      amount: result.data?.amount,
      currency: result.data?.currency,
      data: result.data,
    };
  } else {
    throw new Error(result.message || "Status check failed");
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header for payment request");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Invalid token or user not found:", userError?.message || "User not found");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized",
          message: userError?.message || "Please sign in to continue"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Payment request from authenticated user: ${user.id}`);

    const { action, ...payload } = await req.json();

    console.log("Flutterwave payment action:", action);
    console.log("Payment payload received:", JSON.stringify(payload, null, 2));

    switch (action) {
      case "initiate": {
        try {
          // Validate required fields
          const missingFields: string[] = [];
          if (!payload.amount && payload.amount !== 0) missingFields.push("amount");
          if (!payload.phone_number) missingFields.push("phone_number");
          if (!payload.network) missingFields.push("network");
          if (!payload.reference) missingFields.push("reference");

          if (missingFields.length > 0) {
            console.error("Missing required fields:", missingFields);
            return new Response(
              JSON.stringify({
                success: false,
                error: `Missing required payment fields: ${missingFields.join(", ")}`,
                message: `Missing required payment fields: ${missingFields.join(", ")}`,
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Validate amount is a positive number
          const amount = Number(payload.amount);
          if (isNaN(amount) || amount <= 0) {
            console.error("Invalid amount:", payload.amount);
            return new Response(
              JSON.stringify({
                success: false,
                error: `Invalid amount: ${payload.amount}. Amount must be a positive number`,
                message: `Invalid amount: ${payload.amount}. Amount must be a positive number`,
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Validate phone number format
          const phoneNumber = String(payload.phone_number).trim();
          if (!/^255\d{9}$/.test(phoneNumber)) {
            console.error("Invalid phone number format:", phoneNumber);
            return new Response(
              JSON.stringify({
                success: false,
                error: `Invalid phone number format: ${phoneNumber}. Expected format: 255XXXXXXXXX (12 digits)`,
                message: `Invalid phone number format. Expected format: 255XXXXXXXXX (12 digits)`,
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Validate network
          const validNetworks = ["MPESA", "TIGOPESA", "AIRTELMONEY", "HALOPESA"];
          const network = String(payload.network).toUpperCase().trim();
          if (!validNetworks.includes(network)) {
            console.error("Invalid network:", payload.network);
            return new Response(
              JSON.stringify({
                success: false,
                error: `Invalid network: ${payload.network}. Must be one of: ${validNetworks.join(", ")}`,
                message: `Invalid network. Must be one of: ${validNetworks.join(", ")}`,
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Normalize payload
          const normalizedPayload: PaymentRequest = {
            amount: amount,
            currency: payload.currency || "TZS",
            phone_number: phoneNumber,
            network: network as PaymentRequest["network"],
            reference: String(payload.reference).trim(),
            description: payload.description || "",
            order_id: payload.order_id || undefined,
            email: payload.email || user.email || undefined,
            name: payload.name || undefined,
          };

          console.log("Normalized payment payload:", JSON.stringify(normalizedPayload, null, 2));

          // Initiate payment
          const result = await initiatePayment(normalizedPayload);

          // Store the transaction in the database (non-blocking)
          try {
            const { error: txError } = await supabase.from("payment_transactions").insert({
              user_id: user.id,
              order_id: normalizedPayload.order_id || null,
              amount: normalizedPayload.amount,
              currency: normalizedPayload.currency,
              network: normalizedPayload.network,
              phone_number: normalizedPayload.phone_number,
              reference: normalizedPayload.reference,
              clickpesa_reference: result.transaction_id || null, // Keep field name for compatibility
              status: "pending",
              description: normalizedPayload.description,
            });

            if (txError) {
              console.error("Error storing transaction (non-critical):", txError);
            }
          } catch (dbError) {
            console.error("Database error (non-critical):", dbError);
          }

          return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (paymentError: unknown) {
          const errorMessage = paymentError instanceof Error ? paymentError.message : "Unknown payment error";
          console.error("Payment initiation error:", errorMessage);
          return new Response(
            JSON.stringify({
              success: false,
              error: errorMessage,
              message: errorMessage,
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case "initiate-checkout": {
        try {
          // Validate required fields
          const missingFields: string[] = [];
          if (!payload.amount && payload.amount !== 0) missingFields.push("amount");
          if (!payload.reference) missingFields.push("reference");
          if (!payload.redirect_url) missingFields.push("redirect_url");
          
          // Check for email in different possible locations
          const email = payload.email || payload.customer?.email || user?.email;
          if (!email) missingFields.push("email");

          if (missingFields.length > 0) {
            console.error("Missing required fields:", missingFields);
            return new Response(
              JSON.stringify({
                success: false,
                error: `Missing required fields: ${missingFields.join(", ")}`,
                message: `Missing required fields: ${missingFields.join(", ")}`,
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Validate amount
          const amount = Number(payload.amount);
          if (isNaN(amount) || amount <= 0) {
            return new Response(
              JSON.stringify({
                success: false,
                error: `Invalid amount: ${payload.amount}. Amount must be a positive number`,
                message: `Invalid amount: ${payload.amount}. Amount must be a positive number`,
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Get customer email and name from various possible locations
          const customerEmail = payload.email || payload.customer?.email || user?.email || "";
          const customerName = payload.name || payload.customer?.name || user?.user_metadata?.full_name || "Blinno Customer";

          if (!customerEmail) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Customer email is required",
                message: "Customer email is required",
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log("Initiating checkout with:", {
            amount,
            currency: payload.currency || "TZS",
            reference: String(payload.reference).trim(),
            customerEmail,
            customerName,
            redirect_url: String(payload.redirect_url).trim(),
          });

          // Initiate checkout
          const result = await initiateCheckout({
            amount: amount,
            currency: payload.currency || "TZS",
            reference: String(payload.reference).trim(),
            description: payload.description || "Blinno Subscription",
            customer: {
              email: customerEmail,
              name: customerName,
            },
            redirect_url: String(payload.redirect_url).trim(),
            meta: payload.meta || {},
          });

          console.log("Checkout result:", JSON.stringify(result, null, 2));

          // Store the transaction in the database (non-blocking)
          try {
            const { error: txError } = await supabase.from("payment_transactions").insert({
              user_id: user.id,
              amount: amount,
              currency: payload.currency || "TZS",
              reference: result.reference,
              clickpesa_reference: result.transaction_id || null,
              status: "pending",
              description: payload.description || "Blinno Subscription",
              network: "flutterwave_checkout",
            });

            if (txError) {
              console.error("Error storing transaction (non-critical):", txError);
            }
          } catch (dbError) {
            console.error("Database error (non-critical):", dbError);
          }

          return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (checkoutError: unknown) {
          const errorMessage = checkoutError instanceof Error ? checkoutError.message : "Unknown checkout error";
          console.error("Checkout initiation error:", errorMessage);
          return new Response(
            JSON.stringify({
              success: false,
              error: errorMessage,
              message: errorMessage,
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case "check-status": {
        try {
          const { transaction_id, reference } = payload;

          if (!transaction_id && !reference) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Missing required field: transaction_id or reference",
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Use transaction_id if provided, otherwise try to find it from reference
          let transactionId = transaction_id;
          if (!transactionId && reference) {
            const { data: txData } = await supabase
              .from("payment_transactions")
              .select("clickpesa_reference")
              .eq("reference", reference)
              .eq("user_id", user.id)
              .single();

            if (txData?.clickpesa_reference) {
              transactionId = txData.clickpesa_reference;
            } else {
              // If not found, use reference as transaction ID
              transactionId = reference;
            }
          }

          if (!transactionId) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Transaction ID not found",
              }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const result = await checkPaymentStatus(transactionId);

          // Update transaction status in database if reference provided
          if (reference && result.status) {
            const statusMap: Record<string, string> = {
              successful: "completed",
              completed: "completed",
              failed: "failed",
              cancelled: "cancelled",
              pending: "pending",
            };

            const newStatus = statusMap[result.status.toLowerCase()] || "processing";

            const { error: updateError } = await supabase
              .from("payment_transactions")
              .update({
                status: newStatus,
                clickpesa_reference: result.transaction_id,
              })
              .eq("reference", reference)
              .eq("user_id", user.id);

            if (updateError) {
              console.error("Error updating transaction status:", updateError);
            }

            // If payment completed, update order status
            if (newStatus === "completed") {
              const { data: txData } = await supabase
                .from("payment_transactions")
                .select("order_id")
                .eq("reference", reference)
                .single();

              if (txData?.order_id) {
                await supabase.from("orders").update({ status: "confirmed" }).eq("id", txData.order_id);
              }
            }
          }

          return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (statusError: unknown) {
          const errorMessage = statusError instanceof Error ? statusError.message : "Unknown status check error";
          console.error("Payment status check error:", errorMessage);
          return new Response(
            JSON.stringify({
              success: false,
              error: errorMessage,
              message: errorMessage,
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Flutterwave payment error:", errorMessage, errorStack);

    let statusCode = 500;
    if (errorMessage.includes("not configured") || errorMessage.includes("Unauthorized")) {
      statusCode = 401;
    } else if (errorMessage.includes("Missing required") || errorMessage.includes("Invalid")) {
      statusCode = 400;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: errorMessage,
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

