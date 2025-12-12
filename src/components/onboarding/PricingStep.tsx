/**
 * Pricing Step Component
 * Allows users to select pricing model and plan
 */

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Zap, TrendingUp, Crown, Check, Loader2 } from "lucide-react";
import type { PricingModel, SubscriptionPlan, PercentagePlan } from "@/pages/Onboarding";

// Import plans from Onboarding (or move to shared location)
const subscriptionPlans = [
  {
    id: "starter" as SubscriptionPlan,
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
    id: "professional" as SubscriptionPlan,
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
    id: "enterprise" as SubscriptionPlan,
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
    id: "basic" as PercentagePlan,
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
    id: "growth" as PercentagePlan,
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
    id: "scale" as PercentagePlan,
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

interface PricingStepProps {
  data: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSubscribe?: () => void;
  isProcessing?: boolean;
}

export function PricingStep({ data, onChange, onNext, onBack, onSubscribe, isProcessing }: PricingStepProps) {
  const pricingModel = data.pricingModel || "subscription";
  const selectedPlan = data.plan || (pricingModel === "subscription" ? "professional" : "growth");
  const currentPlans = pricingModel === "subscription" ? subscriptionPlans : percentagePlans;

  const handleModelChange = (model: PricingModel) => {
    const defaultPlan = model === "subscription" ? "professional" : "growth";
    onChange("pricingModel", model);
    onChange("plan", defaultPlan);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select a pricing model that works best for you
        </p>
      </div>

      <Tabs value={pricingModel} onValueChange={handleModelChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscription">Monthly Subscription</TabsTrigger>
          <TabsTrigger value="percentage">Pay Per Sale</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentPlans.map((plan) => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all relative ${
                isSelected
                  ? "ring-2 ring-primary shadow-lg"
                  : "hover:shadow-md"
              } ${plan.popular ? "border-primary" : ""}`}
              onClick={() => onChange("plan", plan.id)}
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
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.description}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {isSelected && (
                    <div className="pt-2">
                      <Badge variant="default" className="w-full justify-center">
                        Selected
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isProcessing}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <div className="flex-1" />
        {pricingModel === "subscription" && onSubscribe ? (
          <Button onClick={onSubscribe} disabled={isProcessing || !selectedPlan}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : onNext ? (
          <Button onClick={onNext} disabled={isProcessing}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

