/**
 * Checkout Payment Callback Page
 * Handles redirects from Flutterwave Hosted Checkout for product purchases
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function CheckoutPaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "cancelled">("loading");
  const [reference, setReference] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get parameters from URL
        const txRef = searchParams.get("tx_ref") || searchParams.get("reference");
        const statusParam = searchParams.get("status");
        const transactionId = searchParams.get("transaction_id");

        if (!txRef) {
          console.error("No transaction reference found in URL");
          setStatus("failed");
          return;
        }

        setReference(txRef);

        // Get order ID from localStorage (stored before redirect)
        const storedOrderId = localStorage.getItem("checkout_order_id");
        if (storedOrderId) {
          setOrderId(storedOrderId);
          localStorage.removeItem("checkout_order_id");
        }

        // Check payment status via Edge Function
        const { data: statusData, error: statusError } = await supabase.functions.invoke(
          "flutterwave-payment",
          {
            body: {
              action: "check-status",
              reference: txRef,
              transaction_id: transactionId,
            },
          }
        );

        if (statusError) {
          console.error("Error checking payment status:", statusError);
          // Still check the status param from URL
          if (statusParam === "successful" || statusParam === "completed") {
            setStatus("success");
          } else if (statusParam === "cancelled") {
            setStatus("cancelled");
          } else {
            setStatus("failed");
          }
          return;
        }

        // Determine status from API response
        const paymentStatus = statusData?.data?.status?.toLowerCase();
        if (paymentStatus === "successful" || paymentStatus === "completed") {
          setStatus("success");
          
          // Update order status if we have the order ID
          if (orderId || storedOrderId) {
            const finalOrderId = orderId || storedOrderId;
            try {
              const { error: updateError } = await supabase
                .from("orders")
                .update({ status: "paid" })
                .eq("id", finalOrderId);

              if (updateError) {
                console.error("Error updating order status:", updateError);
              } else {
                console.log(`Order ${finalOrderId} marked as paid`);
              }
            } catch (updateError) {
              console.error("Error updating order status:", updateError);
            }
          }

          toast({
            title: "Payment Successful!",
            description: "Your order payment has been confirmed.",
          });

          // Redirect to order tracking after a short delay
          setTimeout(() => {
            if (orderId || storedOrderId) {
              navigate(`/order/${orderId || storedOrderId}`, { replace: true });
            } else {
              navigate("/buyer/orders", { replace: true });
            }
          }, 2000);
        } else if (paymentStatus === "cancelled" || statusParam === "cancelled") {
          setStatus("cancelled");
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment. You can try again when ready.",
            variant: "default",
          });
        } else {
          setStatus("failed");
          toast({
            title: "Payment Failed",
            description: "The payment was not successful. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        toast({
          title: "Verification Error",
          description: "Unable to verify payment status. Please contact support.",
          variant: "destructive",
        });
      }
    };

    verifyPayment();
  }, [searchParams, user, navigate, toast, orderId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex min-h-[60vh] items-center justify-center p-4 pt-20">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Verifying Payment</h2>
                <p className="text-muted-foreground">
                  Please wait while we confirm your payment...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
                <p className="text-muted-foreground mb-6">
                  Your order payment has been confirmed. Redirecting to your order...
                </p>
                {reference && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Reference: {reference}
                  </p>
                )}
                <Button 
                  onClick={() => {
                    if (orderId) {
                      navigate(`/order/${orderId}`, { replace: true });
                    } else {
                      navigate("/buyer/orders", { replace: true });
                    }
                  }}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View Order
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {status === "failed" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h2>
                <p className="text-muted-foreground mb-6">
                  The payment was not successful. Please try again or contact support if the problem persists.
                </p>
                {reference && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Reference: {reference}
                  </p>
                )}
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate("/checkout", { replace: true })}>
                    Back to Checkout
                  </Button>
                  <Button onClick={() => navigate("/products")}>
                    Continue Shopping
                  </Button>
                </div>
              </>
            )}

            {status === "cancelled" && (
              <>
                <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Payment Cancelled</h2>
                <p className="text-muted-foreground mb-6">
                  You cancelled the payment. You can complete your order when you're ready.
                </p>
                <Button onClick={() => navigate("/checkout", { replace: true })}>
                  Back to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

