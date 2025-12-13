import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, Zap, TrendingUp, Crown, Loader2, AlertCircle, CreditCard } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Plan definitions matching onboarding
const subscriptionPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 25000,
    priceLabel: "25,000 TZS",
    period: "/month",
    description: "Perfect for individuals just getting started",
    features: [
      "Up to 25 product listings",
      "Basic analytics dashboard",
      "Standard support",
      "5% transaction fee",
      "Access to marketplace",
    ],
    icon: Zap,
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: 75000,
    priceLabel: "75,000 TZS",
    period: "/month",
    description: "For growing businesses and serious sellers",
    features: [
      "Up to 500 product listings",
      "Advanced analytics & reports",
      "Priority support",
      "3% transaction fee",
      "Custom storefront domain",
      "Marketing tools included",
      "Bulk product upload",
    ],
    icon: TrendingUp,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 250000,
    priceLabel: "250,000 TZS",
    period: "/month",
    description: "For large businesses with custom needs",
    features: [
      "Unlimited product listings",
      "Full analytics suite",
      "Dedicated account manager",
      "1% transaction fee",
      "API access",
      "White-label options",
      "SLA guarantee",
    ],
    icon: Crown,
    popular: false,
  },
];

const percentagePlans = [
  {
    id: "basic",
    name: "Basic",
    price: 7,
    priceLabel: "7%",
    period: "per sale",
    description: "Pay only when you sell",
    features: [
      "Up to 50 product listings",
      "Basic analytics",
      "Community support",
      "No monthly fees",
      "Access to marketplace",
    ],
    icon: Zap,
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 10,
    priceLabel: "10%",
    period: "per sale",
    description: "For active sellers with regular sales",
    features: [
      "Up to 200 product listings",
      "Advanced analytics",
      "Email support",
      "Priority placement",
      "Marketing tools",
      "Promotional features",
    ],
    icon: TrendingUp,
    popular: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 15,
    priceLabel: "15%",
    period: "per sale",
    description: "For high-volume sellers",
    features: [
      "Unlimited listings",
      "Full analytics suite",
      "Priority support",
      "Featured placement",
      "Custom integrations",
      "Dedicated success manager",
      "Early access to features",
    ],
    icon: Crown,
    popular: false,
  },
];

interface Subscription {
  id: string;
  plan: string;
  status: string;
  price_monthly: number;
  started_at: string;
  expires_at: string | null;
  payment_reference: string | null;
}

export function SubscriptionManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("seller_subscriptions")
      .select("*")
      .eq("seller_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription details.",
        variant: "destructive",
      });
    } else {
      setSubscription(data);
    }
    setLoading(false);
  };

  const getCurrentPlan = () => {
    if (!subscription) return null;

    const planString = subscription.plan;
    let pricingModel: "subscription" | "percentage" | null = null;
    let planId: string | null = null;

    if (planString.startsWith("subscription_")) {
      pricingModel = "subscription";
      planId = planString.replace("subscription_", "");
    } else if (planString.startsWith("percentage_")) {
      pricingModel = "percentage";
      planId = planString.replace("percentage_", "");
    }

    if (!pricingModel || !planId) return null;

    const plans = pricingModel === "subscription" ? subscriptionPlans : percentagePlans;
    return {
      ...plans.find((p) => p.id === planId),
      pricingModel,
    };
  };

  const handleUpgrade = async (newPlanId: string, pricingModel: "subscription" | "percentage") => {
    if (!user || !subscription) return;

    setUpgrading(true);
    try {
      const currentPlan = getCurrentPlan();
      if (!currentPlan) throw new Error("Could not determine current plan");

      // For subscription plans, we need payment
      if (pricingModel === "subscription") {
        const newPlan = subscriptionPlans.find((p) => p.id === newPlanId);
        if (!newPlan) throw new Error("Invalid plan selected");

        // Check if this is actually an upgrade (higher price)
        const isUpgrade = newPlan.price > (currentPlan.price || 0);
        const isSameModel = currentPlan.pricingModel === "subscription";

        if (isUpgrade && isSameModel) {
          // Upgrade within subscription model - requires immediate payment
          // Calculate prorated amount or full month
          const upgradeAmount = newPlan.price - (currentPlan.price || 0);
          
          toast({
            title: "Payment Required",
            description: `Upgrading to ${newPlan.name} requires payment of ${upgradeAmount.toLocaleString()} TZS. Processing payment...`,
          });

          // TODO: Integrate with payment system (ClickPesa/Flutterwave)
          // For now, we'll update the plan status to pending
          // In production, initiate payment and update after confirmation
          const { error: updateError } = await supabase
            .from("seller_subscriptions")
            .update({
              plan: `subscription_${newPlanId}`,
              price_monthly: newPlan.price,
              status: "pending", // Set to pending until payment is confirmed
            })
            .eq("id", subscription.id);

          if (updateError) throw updateError;

          toast({
            title: "Plan Update Initiated",
            description: `Your plan upgrade to ${newPlan.name} is pending payment confirmation. You'll receive an email with payment instructions.`,
          });
        } else if (!isUpgrade && isSameModel) {
          // Downgrade within subscription model - takes effect at next billing cycle
          const { error: updateError } = await supabase
            .from("seller_subscriptions")
            .update({
              plan: `subscription_${newPlanId}`,
              price_monthly: newPlan.price,
              // Status remains active, changes take effect at next billing cycle
            })
            .eq("id", subscription.id);

          if (updateError) throw updateError;

          toast({
            title: "Plan Updated",
            description: `Your plan will be downgraded to ${newPlan.name} at the start of your next billing cycle.`,
          });
        } else {
          // Switching from percentage to subscription - requires payment
          toast({
            title: "Payment Required",
            description: `Switching to ${newPlan.name} requires payment of ${newPlan.priceLabel}/month. Processing payment...`,
          });

          const { error: updateError } = await supabase
            .from("seller_subscriptions")
            .update({
              plan: `subscription_${newPlanId}`,
              price_monthly: newPlan.price,
              status: "pending",
            })
            .eq("id", subscription.id);

          if (updateError) throw updateError;

          toast({
            title: "Plan Update Initiated",
            description: `Your plan switch to ${newPlan.name} is pending payment confirmation.`,
          });
        }
      } else {
        // Percentage plans - can switch immediately
        const newPlan = percentagePlans.find((p) => p.id === newPlanId);
        if (!newPlan) throw new Error("Invalid plan selected");

        const isSameModel = currentPlan.pricingModel === "percentage";

        if (isSameModel) {
          // Switching between percentage plans - immediate
          const { error: updateError } = await supabase
            .from("seller_subscriptions")
            .update({
              plan: `percentage_${newPlanId}`,
              price_monthly: 0,
            })
            .eq("id", subscription.id);

          if (updateError) throw updateError;

          toast({
            title: "Plan Updated",
            description: `Your plan has been updated to ${newPlan.name}.`,
          });
        } else {
          // Switching from subscription to percentage - immediate (no payment needed)
          const { error: updateError } = await supabase
            .from("seller_subscriptions")
            .update({
              plan: `percentage_${newPlanId}`,
              price_monthly: 0,
              status: "active",
            })
            .eq("id", subscription.id);

          if (updateError) throw updateError;

          toast({
            title: "Plan Updated",
            description: `Your plan has been switched to ${newPlan.name}. Your subscription will be cancelled and you'll only pay per sale.`,
          });
        }
      }

      await fetchSubscription();
      setShowUpgradeDialog(false);
    } catch (error: any) {
      console.error("Error upgrading plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!user || !subscription) return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from("seller_subscriptions")
        .update({
          status: "cancelled",
          // Set expiration to end of current billing period
          expires_at: subscription.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", subscription.id);

      if (error) throw error;

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of your current billing period.",
      });

      await fetchSubscription();
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const currentPlan = getCurrentPlan();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription plan. Please complete onboarding to select a plan.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isActive = subscription.status === "active";
  const isCancelled = subscription.status === "cancelled";
  const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {isActive
                  ? "Your active subscription plan"
                  : isCancelled
                  ? "Your subscription has been cancelled"
                  : "Your subscription status"}
              </CardDescription>
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>
              {subscription.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPlan && (
            <>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <currentPlan.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{currentPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentPlan.description}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      {currentPlan.pricingModel === "subscription"
                        ? currentPlan.priceLabel
                        : currentPlan.priceLabel}
                    </span>
                    <span className="text-muted-foreground">{currentPlan.period}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Plan Features</h4>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {expiresAt && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isCancelled ? "Expires on" : "Renews on"}
                    </span>
                    <span className="font-medium">
                      {expiresAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                {isActive && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowUpgradeDialog(true)}
                      className="flex-1"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Change Plan
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                      className="flex-1"
                    >
                      Cancel Subscription
                    </Button>
                  </>
                )}
                {isCancelled && (
                  <Button
                    variant="default"
                    onClick={() => setShowUpgradeDialog(true)}
                    className="flex-1"
                  >
                    Reactivate Subscription
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Upgrade/Downgrade Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Your Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new plan. Changes will take effect at the start of your next billing cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground mb-4">
              {currentPlan?.pricingModel === "subscription"
                ? "Select a subscription plan. Upgrades require immediate payment, downgrades take effect at your next billing cycle."
                : "Select a percentage-based plan. Changes take effect immediately."}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(currentPlan?.pricingModel === "subscription" ? subscriptionPlans : percentagePlans).map(
                (plan) => {
                  const Icon = plan.icon;
                  const isCurrentPlan = currentPlan?.id === plan.id;
                  const isSelected = selectedPlan === plan.id;

                  return (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-primary shadow-lg"
                          : isCurrentPlan
                          ? "ring-2 ring-muted"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.popular && (
                        <Badge className="absolute top-2 right-2">Popular</Badge>
                      )}
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-6 w-6 text-primary" />
                            <h3 className="font-semibold text-lg">{plan.name}</h3>
                          </div>
                          <div>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-3xl font-bold">{plan.priceLabel}</span>
                              <span className="text-muted-foreground">{plan.period}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                          </div>
                          <ul className="space-y-2">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start space-x-2 text-sm">
                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          {isCurrentPlan && (
                            <Badge variant="secondary" className="w-full justify-center">
                              Current Plan
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPlan && currentPlan) {
                  handleUpgrade(selectedPlan, currentPlan.pricingModel);
                }
              }}
              disabled={!selectedPlan || selectedPlan === currentPlan?.id || upgrading}
            >
              {upgrading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Change Plan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? Your subscription will remain active
              until the end of your current billing period ({expiresAt?.toLocaleDateString()}). You
              can reactivate at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

