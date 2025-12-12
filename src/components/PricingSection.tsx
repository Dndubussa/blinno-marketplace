import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, CreditCard, Percent } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const subscriptionPlans = [
  {
    name: "Starter",
    description: "Perfect for individuals just getting started",
    price: "25,000 TZS",
    period: "/month",
    features: [
      "Up to 25 product listings",
      "Basic analytics dashboard",
      "Standard support",
      "5% transaction fee",
      "Access to marketplace",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    description: "For growing businesses and serious sellers",
    price: "75,000 TZS",
    period: "/month",
    features: [
      "Up to 500 product listings",
      "Advanced analytics & reports",
      "Priority support",
      "3% transaction fee",
      "Custom storefront domain",
      "Marketing tools included",
      "Bulk product upload",
    ],
    cta: "Get Started Today",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large businesses with custom needs",
    price: "250,000 TZS",
    period: "/month",
    features: [
      "Unlimited product listings",
      "Full analytics suite",
      "Dedicated account manager",
      "1% transaction fee",
      "API access",
      "White-label options",
      "SLA guarantee",
    ],
    cta: "Get Started Today",
    popular: false,
  },
];

const percentagePlans = [
  {
    name: "Basic",
    description: "Pay only when you sell",
    price: "7%",
    period: "per sale",
    features: [
      "Up to 50 product listings",
      "Basic analytics",
      "Community support",
      "No monthly fees",
      "Access to marketplace",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Growth",
    description: "For active sellers with regular sales",
    price: "10%",
    period: "per sale",
    features: [
      "Up to 200 product listings",
      "Advanced analytics",
      "Email support",
      "Priority placement",
      "Marketing tools",
      "Promotional features",
    ],
    cta: "Start Selling",
    popular: true,
  },
  {
    name: "Scale",
    description: "For high-volume sellers",
    price: "15%",
    period: "per sale",
    features: [
      "Unlimited listings",
      "Full analytics suite",
      "Priority support",
      "Featured placement",
      "Custom integrations",
      "Dedicated success manager",
      "Early access to features",
    ],
    cta: "Get Started Today",
    popular: false,
  },
];

export function PricingSection() {
  const [pricingModel, setPricingModel] = useState<"subscription" | "percentage">("subscription");

  const plans = pricingModel === "subscription" ? subscriptionPlans : percentagePlans;

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Pricing
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Choose how you want to grow
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Flexible pricing models to fit your business needs
          </p>
        </motion.div>

        {/* Pricing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 flex justify-center"
        >
          <Tabs value={pricingModel} onValueChange={(v) => setPricingModel(v as "subscription" | "percentage")} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="subscription" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-foreground">
                <CreditCard className="h-4 w-4" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="percentage" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-foreground">
                <Percent className="h-4 w-4" />
                Per Sale
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={`${pricingModel}-${plan.name}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-xl border ${
                plan.popular 
                  ? "border-primary bg-white shadow-lg" 
                  : "border-border bg-white shadow-sm"
              } p-6`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="font-display text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground"> {plan.period}</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Button 
                  variant={plan.popular ? "default" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pricing Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          {pricingModel === "subscription" 
            ? "Cancel anytime."
            : "No monthly fees. You only pay when you make a sale."
          }
        </motion.p>
      </div>
    </section>
  );
}
