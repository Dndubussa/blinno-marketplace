import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  Store,
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  Phone,
  Building,
  Sparkles,
  Heart,
  Package,
  TrendingUp,
  Crown,
  Zap,
  Loader2,
  CreditCard,
  Percent,
} from "lucide-react";

type Role = "buyer" | "seller";
type PricingModel = "subscription" | "percentage";
type SubscriptionPlan = "starter" | "professional" | "enterprise";
type PercentagePlan = "basic" | "growth" | "scale";
type SellerPlan = SubscriptionPlan | PercentagePlan;

interface OnboardingData {
  role: Role | null;
  // Buyer fields
  interests: string[];
  // Seller fields
  businessName: string;
  businessDescription: string;
  businessAddress: string;
  phoneNumber: string;
  pricingModel: PricingModel;
  plan: SellerPlan;
}

const buyerInterests = [
  { id: "electronics", label: "Electronics", icon: "💻" },
  { id: "fashion", label: "Fashion", icon: "👗" },
  { id: "home", label: "Home & Living", icon: "🏠" },
  { id: "books", label: "Books", icon: "📚" },
  { id: "beauty", label: "Beauty", icon: "💄" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "food", label: "Food & Drinks", icon: "🍕" },
  { id: "art", label: "Art & Crafts", icon: "🎨" },
];

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

export default function Onboarding() {
  const { user, loading, becomeSeller } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [pricingModel, setPricingModel] = useState<PricingModel>("subscription");
  const [data, setData] = useState<OnboardingData>({
    role: null,
    interests: [],
    businessName: "",
    businessDescription: "",
    businessAddress: "",
    phoneNumber: "",
    pricingModel: "subscription",
    plan: "professional",
  });

  const currentPlans = pricingModel === "subscription" ? subscriptionPlans : percentagePlans;

  const totalSteps = data.role === "seller" ? 4 : 3;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleRoleSelect = (role: Role) => {
    setData({ ...data, role });
    setStep(2);
  };

  const toggleInterest = (interest: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handlePlanSelect = (plan: SellerPlan) => {
    setData({ ...data, plan, pricingModel });
  };

  const handlePricingModelChange = (model: PricingModel) => {
    setPricingModel(model);
    // Reset plan to the popular one in the new model
    const defaultPlan = model === "subscription" ? "professional" : "growth";
    setData({ ...data, pricingModel: model, plan: defaultPlan });
  };

  const handlePayment = async () => {
    // Percentage plans have no upfront payment
    if (data.pricingModel === "percentage") {
      await handleComplete();
      return;
    }

    if (!data.phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number for payment",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      const selectedPlan = currentPlans.find((p) => p.id === data.plan);
      
      const { data: paymentData, error } = await supabase.functions.invoke(
        "clickpesa-payment",
        {
          body: {
            action: "initiate",
            amount: selectedPlan?.price || 0,
            currency: "TZS",
            phone_number: data.phoneNumber,
            network: "MPESA",
            reference: `SUB-${user?.id?.slice(0, 8)}-${Date.now()}`,
            description: `Blinno ${selectedPlan?.name} Plan Subscription`,
          },
        }
      );

      if (error) throw error;

      if (paymentData.success) {
        toast({
          title: "Payment initiated",
          description: "Check your phone for the M-Pesa prompt. Complete the payment to activate your plan.",
        });
        
        await handleComplete();
      } else {
        throw new Error(paymentData.error || "Payment failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "Could not process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      if (data.role === "seller") {
        // Add seller role
        const { error: roleError } = await becomeSeller();
        if (roleError) throw roleError;

        // Update profile with business info
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            bio: `${data.businessName}\n${data.businessDescription}`,
          })
          .eq("id", user?.id);

        if (profileError) throw profileError;

        // Create subscription record
        const selectedPlan = currentPlans.find((p) => p.id === data.plan);
        const isPercentage = data.pricingModel === "percentage";
        const { error: subError } = await supabase
          .from("seller_subscriptions")
          .insert({
            seller_id: user?.id,
            plan: `${data.pricingModel}_${data.plan}`,
            price_monthly: isPercentage ? 0 : (selectedPlan?.price || 0),
            status: "active",
            expires_at: isPercentage 
              ? null 
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (subError) throw subError;

        toast({
          title: "Welcome to Blinno!",
          description: "Your seller account is ready. Start listing your products!",
        });
        navigate("/seller");
      } else {
        // Update buyer interests in profile
        const { error } = await supabase
          .from("profiles")
          .update({
            bio: `Interests: ${data.interests.join(", ")}`,
          })
          .eq("id", user?.id);

        if (error) throw error;

        toast({
          title: "Welcome to Blinno!",
          description: "Discover amazing products tailored for you.",
        });
        navigate("/buyer");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 <= step ? "w-12 bg-primary" : "w-8 bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Badge variant="secondary" className="mb-4">
                  Step 1 of {totalSteps}
                </Badge>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  How will you use Blinno?
                </h1>
                <p className="text-muted-foreground">
                  Choose your primary role. You can always change this later.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card
                  className="cursor-pointer border-2 hover:border-primary/50 transition-all group"
                  onClick={() => handleRoleSelect("buyer")}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <ShoppingBag className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      I want to Buy
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Discover and purchase amazing products from sellers across
                      Tanzania
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> Save favorites
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" /> Track orders
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer border-2 hover:border-primary/50 transition-all group"
                  onClick={() => handleRoleSelect("seller")}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <Store className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      I want to Sell
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Start your online business and reach customers across
                      Tanzania
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Grow sales
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Easy setup
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Step 2: Role-specific info */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Badge variant="secondary" className="mb-4">
                  Step 2 of {totalSteps}
                </Badge>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {data.role === "buyer"
                    ? "What interests you?"
                    : "Tell us about your business"}
                </h1>
                <p className="text-muted-foreground">
                  {data.role === "buyer"
                    ? "Select categories you're interested in"
                    : "This helps customers find and trust your store"}
                </p>
              </div>

              {data.role === "buyer" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {buyerInterests.map((interest) => (
                    <Card
                      key={interest.id}
                      className={`cursor-pointer border-2 transition-all ${
                        data.interests.includes(interest.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/30"
                      }`}
                      onClick={() => toggleInterest(interest.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <span className="text-2xl mb-2 block">
                          {interest.icon}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {interest.label}
                        </span>
                        {data.interests.includes(interest.id) && (
                          <Check className="w-4 h-4 text-primary mx-auto mt-1" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="flex items-center gap-2">
                        <Building className="w-4 h-4" /> Business Name
                      </Label>
                      <Input
                        id="businessName"
                        placeholder="Your Store Name"
                        value={data.businessName}
                        onChange={(e) =>
                          setData({ ...data, businessName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Business Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell customers what you sell..."
                        value={data.businessDescription}
                        onChange={(e) =>
                          setData({ ...data, businessDescription: e.target.value })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Business Address
                      </Label>
                      <Input
                        id="address"
                        placeholder="City, Region"
                        value={data.businessAddress}
                        onChange={(e) =>
                          setData({ ...data, businessAddress: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Phone Number (for payments)
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+255 XXX XXX XXX"
                        value={data.phoneNumber}
                        onChange={(e) =>
                          setData({ ...data, phoneNumber: e.target.value })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={
                    data.role === "buyer"
                      ? data.interests.length === 0
                      : !data.businessName
                  }
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Plan Selection (Seller only) or Confirmation (Buyer) */}
          {step === 3 && data.role === "seller" && (
            <motion.div
              key="step3-seller"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Badge variant="secondary" className="mb-4">
                  Step 3 of {totalSteps}
                </Badge>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Choose how you want to grow
                </h1>
                <p className="text-muted-foreground">
                  Flexible pricing models to fit your business needs
                </p>
              </div>

              {/* Pricing Toggle */}
              <div className="flex justify-center">
                <Tabs value={pricingModel} onValueChange={(v) => handlePricingModelChange(v as PricingModel)} className="w-full max-w-md">
                  <TabsList className="grid w-full grid-cols-2 bg-muted">
                    <TabsTrigger value="subscription" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
                      <CreditCard className="h-4 w-4" />
                      Subscription
                    </TabsTrigger>
                    <TabsTrigger value="percentage" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
                      <Percent className="h-4 w-4" />
                      Per Sale
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {currentPlans.map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer border-2 transition-all relative ${
                        data.plan === plan.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/30"
                      }`}
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                          Most Popular
                        </Badge>
                      )}
                      <CardContent className="p-6">
                        <div className="text-center mb-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                              data.plan === plan.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <h3 className="font-semibold text-foreground">
                            {plan.name}
                          </h3>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {plan.priceLabel}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              {plan.period}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {plan.description}
                          </p>
                        </div>

                        <ul className="space-y-2 text-sm">
                          {plan.features.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-muted-foreground"
                            >
                              <Check className="w-4 h-4 text-primary flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        {data.plan === plan.id && (
                          <div className="mt-4 text-center">
                            <Badge variant="secondary">Selected</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pricing Note */}
              <p className="text-center text-sm text-muted-foreground">
                {pricingModel === "subscription" 
                  ? "All subscription plans include a 14-day free trial. Cancel anytime."
                  : "No monthly fees. You only pay when you make a sale."
                }
              </p>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep(4)}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3 for Buyer / Step 4 for Seller: Confirmation */}
          {((step === 3 && data.role === "buyer") || (step === 4 && data.role === "seller")) && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Badge variant="secondary" className="mb-4">
                  Step {data.role === "buyer" ? 3 : 4} of {totalSteps}
                </Badge>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {data.role === "buyer" ? "You're all set!" : "Confirm & Subscribe"}
                </h1>
                <p className="text-muted-foreground">
                  {data.role === "buyer"
                    ? "Start exploring products tailored just for you"
                    : data.pricingModel === "percentage"
                    ? "Start selling with no upfront costs"
                    : "Complete payment to activate your subscription"}
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Type</span>
                      <span className="font-medium text-foreground capitalize">
                        {data.role}
                      </span>
                    </div>
                    {data.role === "buyer" ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interests</span>
                        <span className="font-medium text-foreground">
                          {data.interests.length} selected
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Business</span>
                          <span className="font-medium text-foreground">
                            {data.businessName}
                          </span>
                        </div>
                        {data.businessAddress && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location</span>
                            <span className="font-medium text-foreground">
                              {data.businessAddress}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pricing Model</span>
                          <span className="font-medium text-foreground capitalize">
                            {data.pricingModel === "subscription" ? "Monthly Subscription" : "Per Sale"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plan</span>
                          <span className="font-medium text-foreground">
                            {currentPlans.find((p) => p.id === data.plan)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-3 mt-3">
                          <span className="text-foreground font-medium">
                            {data.pricingModel === "subscription" ? "Monthly Cost" : "Commission Rate"}
                          </span>
                          <span className="font-bold text-foreground">
                            {currentPlans.find((p) => p.id === data.plan)?.priceLabel}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              {currentPlans.find((p) => p.id === data.plan)?.period}
                            </span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {data.role === "seller" && data.pricingModel === "subscription" && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      💳 Payment will be processed via M-Pesa to your number:{" "}
                      <strong>{data.phoneNumber || "Not provided"}</strong>
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setStep(data.role === "buyer" ? 2 : 3)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                {data.role === "buyer" ? (
                  <Button onClick={handleComplete} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Get Started <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePayment}
                    disabled={isSubmitting || isProcessingPayment}
                  >
                    {isSubmitting || isProcessingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isProcessingPayment ? "Processing..." : "Setting up..."}
                      </>
                    ) : data.pricingModel === "percentage" ? (
                      <>
                        Get Started <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Pay & Subscribe <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
