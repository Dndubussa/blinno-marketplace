import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard, Smartphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MobileNetwork = "MPESA" | "TIGOPESA" | "AIRTELMONEY" | "HALOPESA";

const mobileNetworks: { id: MobileNetwork; name: string; color: string; description?: string }[] = [
  { id: "MPESA", name: "M-Pesa", color: "bg-green-500", description: "Vodacom" },
  { id: "TIGOPESA", name: "Tigo Pesa", color: "bg-blue-500", description: "Mix By Yas" },
  { id: "AIRTELMONEY", name: "Airtel Money", color: "bg-red-500" },
  { id: "HALOPESA", name: "Halopesa", color: "bg-orange-500" },
];

interface SubscriptionPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  planName: string;
  subscriptionId: string;
  newPlanId: string;
  newPlanPrice: number;
  onPaymentSuccess: () => void;
}

export function SubscriptionPaymentDialog({
  open,
  onOpenChange,
  amount,
  planName,
  subscriptionId,
  newPlanId,
  newPlanPrice,
  onPaymentSuccess,
}: SubscriptionPaymentDialogProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "hosted">("mobile");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState<MobileNetwork>("MPESA");
  const [processing, setProcessing] = useState(false);

  const formatPhoneNumber = (phone: string): string => {
    let formatted = phone.replace(/\D/g, "");
    if (formatted.startsWith("0")) {
      formatted = "255" + formatted.substring(1);
    } else if (formatted.startsWith("+255")) {
      formatted = formatted.substring(1);
    } else if (!formatted.startsWith("255")) {
      formatted = "255" + formatted;
    }
    return formatted;
  };

  const handleMobilePayment = async () => {
    if (!phoneNumber || !network) {
      toast({
        title: "Missing Information",
        description: "Please enter your phone number and select a network",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (formattedPhone.length !== 12 || !formattedPhone.startsWith("255")) {
      toast({
        title: "Invalid Phone Number",
        description: "Please use format: +255 XXX XXX XXX or 0XXX XXX XXX",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const reference = `SUB-UPGRADE-${subscriptionId.slice(0, 8)}-${Date.now()}`;

      // Create payment transaction first (subscription_id will be added after migration)
      const transactionData: any = {
        user_id: user.id,
        amount: amount,
        currency: "TZS",
        network: network,
        phone_number: formattedPhone,
        reference: reference,
        description: `Subscription upgrade to ${planName} - Subscription ID: ${subscriptionId}`,
        status: "pending",
      };

      // Add subscription_id if column exists (after migration)
      try {
        transactionData.subscription_id = subscriptionId;
      } catch (e) {
        // Column might not exist yet - will be added by migration
        console.log("subscription_id column may not exist yet");
      }

      const { data: transaction, error: txError } = await supabase
        .from("payment_transactions")
        .insert(transactionData)
        .select()
        .single();

      if (txError) {
        // If subscription_id column doesn't exist, try without it
        if (txError.message.includes("subscription_id")) {
          delete transactionData.subscription_id;
          const { data: retryTx, error: retryError } = await supabase
            .from("payment_transactions")
            .insert(transactionData)
            .select()
            .single();
          if (retryError) throw retryError;
        } else {
          throw txError;
        }
      }

      // Initiate ClickPesa payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        "clickpesa-payment",
        {
          body: {
            action: "initiate",
            amount: amount,
            currency: "TZS",
            phone_number: formattedPhone,
            network: network,
            reference: reference,
            description: `Blinno Subscription Upgrade - ${planName}`,
            subscription_id: subscriptionId,
          },
        }
      );

      if (paymentError) throw paymentError;

      if (!paymentData?.success) {
        throw new Error(paymentData?.error || "Payment initiation failed");
      }

      // Update subscription plan to new plan (status will be updated by webhook)
      const { error: subUpdateError } = await supabase
        .from("seller_subscriptions")
        .update({
          plan: `subscription_${newPlanId}`,
          price_monthly: newPlanPrice,
          status: "pending", // Will be updated to active by webhook when payment confirms
          payment_reference: reference,
        })
        .eq("id", subscriptionId);

      if (subUpdateError) {
        console.error("Error updating subscription:", subUpdateError);
        // Continue anyway - webhook can update it
      }

      toast({
        title: "Payment Initiated",
        description: "Check your phone for the payment prompt. Your subscription will be activated once payment is confirmed.",
      });

      onOpenChange(false);
      onPaymentSuccess();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleHostedCheckout = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const reference = `SUB-UPGRADE-${subscriptionId.slice(0, 8)}-${Date.now()}`;

      // Create payment transaction (subscription_id will be added after migration)
      const transactionData: any = {
        user_id: user.id,
        amount: amount,
        currency: "TZS",
        network: "flutterwave_checkout",
        phone_number: user.phone || "",
        reference: reference,
        description: `Subscription upgrade to ${planName} - Subscription ID: ${subscriptionId}`,
        status: "pending",
      };

      // Add subscription_id if column exists (after migration)
      try {
        transactionData.subscription_id = subscriptionId;
      } catch (e) {
        // Column might not exist yet
        console.log("subscription_id column may not exist yet");
      }

      const { data: transaction, error: txError } = await supabase
        .from("payment_transactions")
        .insert(transactionData)
        .select()
        .single();

      if (txError) {
        // If subscription_id column doesn't exist, try without it
        if (txError.message.includes("subscription_id")) {
          delete transactionData.subscription_id;
          const { data: retryTx, error: retryError } = await supabase
            .from("payment_transactions")
            .insert(transactionData)
            .select()
            .single();
          if (retryError) throw retryError;
        } else {
          throw txError;
        }
      }

      // Initiate Flutterwave Hosted Checkout
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "flutterwave-payment",
        {
          body: {
            action: "initiate-checkout",
            amount: amount,
            currency: "TZS",
            reference: reference,
            description: `Blinno Subscription Upgrade - ${planName}`,
            customer: {
              email: user.email || "",
              name: user.user_metadata?.full_name || "Blinno Customer",
            },
            redirect_url: `${window.location.origin}/seller/subscription/payment-callback`,
            meta: {
              subscription_id: subscriptionId,
              plan_name: planName,
              type: "subscription_upgrade",
            },
          },
        }
      );

      if (checkoutError) throw checkoutError;

      if (!checkoutData?.success || !checkoutData?.data?.checkout_url) {
        throw new Error(checkoutData?.error || "Failed to create checkout link");
      }

      // Update subscription plan to new plan (status will be updated by webhook)
      const { error: subUpdateError } = await supabase
        .from("seller_subscriptions")
        .update({
          plan: `subscription_${newPlanId}`,
          price_monthly: newPlanPrice,
          status: "pending", // Will be updated to active by webhook when payment confirms
          payment_reference: reference,
        })
        .eq("id", subscriptionId);

      if (subUpdateError) {
        console.error("Error updating subscription:", subUpdateError);
        // Continue anyway - webhook can update it
      }

      // Redirect to Flutterwave checkout
      window.location.href = checkoutData.data.checkout_url;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Pay {amount.toLocaleString()} TZS to upgrade to {planName} plan
          </DialogDescription>
        </DialogHeader>

        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "mobile" | "hosted")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mobile" className="gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Money
            </TabsTrigger>
            <TabsTrigger value="hosted" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Card/All Methods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mobile" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+255 XXX XXX XXX or 0XXX XXX XXX"
              />
            </div>

            <div className="space-y-3">
              <Label>Mobile Money Network</Label>
              <RadioGroup value={network} onValueChange={(v) => setNetwork(v as MobileNetwork)}>
                <div className="grid grid-cols-2 gap-3">
                  {mobileNetworks.map((net) => (
                    <div key={net.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={net.id} id={net.id} />
                      <Label
                        htmlFor={net.id}
                        className="flex-1 cursor-pointer p-2 border rounded-lg hover:bg-muted"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${net.color}`} />
                          <div>
                            <div className="text-sm font-medium">{net.name}</div>
                            {net.description && (
                              <div className="text-xs text-muted-foreground">{net.description}</div>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={handleMobilePayment}
              disabled={processing || !phoneNumber || !network}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {amount.toLocaleString()} TZS
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="hosted" className="space-y-4 mt-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                You'll be redirected to a secure payment page where you can pay with card, mobile money, or other methods.
              </p>
            </div>

            <Button
              onClick={handleHostedCheckout}
              disabled={processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Continue to Payment
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

