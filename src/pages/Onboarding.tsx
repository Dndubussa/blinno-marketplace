import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag,
  Store,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Heart,
  Package,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { StepRenderer } from "@/components/onboarding/StepRenderer";
import { getStepConfig, validateStep, getOrderedSteps, type StepId } from "@/lib/onboardingSteps";
import type { SellerType } from "@/lib/sellerTypes";
import type { StepConfig } from "@/lib/onboardingSteps";

type Role = "buyer" | "seller";

interface OnboardingData {
  role: Role | null;
  // Buyer fields
  interests: string[];
  // Seller fields - dynamic based on seller type
  sellerType: SellerType | null;
  [key: string]: any; // Allow dynamic fields from step configurations
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

export default function Onboarding() {
  const { user, loading, becomeSeller } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const {
    status: onboardingStatus,
    loading: onboardingLoading,
    completeStep,
    completeOnboarding,
    getSteps,
  } = useOnboardingStatus();

  // Buyer flow state
  const [buyerStep, setBuyerStep] = useState(1);
  
  // Seller flow state - using new multi-profile system
  const [sellerStepIndex, setSellerStepIndex] = useState(0);
  const [sellerSteps, setSellerSteps] = useState<StepConfig[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed" | null>(null);
  const pollCountRef = useRef(0);

  // Get role from location state (if coming from email verification or direct navigation)
  const roleFromState = location.state?.role as Role | undefined;

  const [data, setData] = useState<OnboardingData>({
    role: roleFromState || null,
    interests: [],
    sellerType: null,
  });

  // Check for OAuth errors in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      let errorMessage = "Authentication failed. Please try again.";

      if (error === "server_error" && errorDescription?.includes("Unable to exchange external code")) {
        errorMessage =
          "OAuth authentication failed. The redirect URL may not be configured correctly. Please contact support or try signing in with email and password.";
      } else if (errorDescription) {
        errorMessage = decodeURIComponent(errorDescription);
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });

      navigate("/onboarding", { replace: true });
    }
  }, [location.search, navigate, toast]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Check if user has already completed onboarding - redirect to dashboard
  useEffect(() => {
    if (!onboardingLoading && onboardingStatus) {
      if (
        onboardingStatus.isComplete &&
        onboardingStatus.onboardingVersion >= onboardingStatus.requiredVersion
      ) {
        toast({
          title: "Onboarding Already Complete",
          description: "You have already completed onboarding. Redirecting to dashboard...",
        });
        navigate("/seller", { replace: true });
        return;
      }
    }
  }, [onboardingLoading, onboardingStatus, navigate, toast]);

  // Initialize seller steps only on initial load or when loading from database
  useEffect(() => {
    if (data.role === "seller" && !onboardingLoading) {
      // If user already has seller type from database, use it (initial load)
      if (onboardingStatus?.sellerType && !data.sellerType) {
        setData((prev) => ({ ...prev, sellerType: onboardingStatus.sellerType }));
        // Load steps for existing seller type
        const steps = getOrderedSteps(onboardingStatus.sellerType, false);
        setSellerSteps(steps);
      } else if (!data.sellerType && sellerSteps.length === 0) {
        // New seller - start with just category step (only if no steps loaded yet)
        const categoryStep = getStepConfig("category");
        if (categoryStep) {
          setSellerSteps([categoryStep]);
          setSellerStepIndex(0);
        }
      }
      // Don't reload steps if sellerType is already set in local state
      // That's handled by handleSellerFieldChange when user selects a type
    }
  }, [data.role, onboardingLoading, onboardingStatus]);

  // Handle role selection
  const handleRoleSelect = (role: Role) => {
    setData({ ...data, role });
    if (role === "buyer") {
      setBuyerStep(2);
    }
    // For seller, steps will be initialized by useEffect above
  };

  // Buyer flow handlers
  const toggleInterest = (interest: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleBuyerComplete = async () => {
    setIsSubmitting(true);
    try {
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

  // Seller flow handlers
  const handleSellerFieldChange = (fieldId: string, value: any) => {
    setData((prev) => ({ ...prev, [fieldId]: value }));
    
    // Special handling for seller type selection
    if (fieldId === "sellerType" && value) {
      // Reload steps for the selected seller type using the selected type directly
      const steps = getOrderedSteps(value, false); // false = only required steps
      setSellerSteps(steps);
      // Ensure we're on the category step (index 0) when seller type is selected
      // This is the first step, so index should be 0
      if (sellerStepIndex !== 0 || steps[0]?.id !== "category") {
        setSellerStepIndex(0);
      }
    }
  };

  // Complete seller onboarding - defined early so it can be used in other callbacks
  const handleSellerComplete = useCallback(async () => {
    setIsSubmitting(true);

    try {
      // Add seller role
      const { error: roleError } = await becomeSeller();
      if (roleError) throw roleError;

      // Create subscription if subscription model
      if (data.pricingModel === "subscription" && paymentStatus === "completed") {
        const subscriptionPrices: Record<string, number> = {
          starter: 25000,
          professional: 75000,
          enterprise: 250000,
        };
        const selectedPlan = data.plan;
        const planPrice = subscriptionPrices[selectedPlan] || 0;

        const { error: subError } = await supabase.from("seller_subscriptions").insert({
          seller_id: user?.id,
          plan: `subscription_${selectedPlan}`,
          price_monthly: planPrice,
          status: "active",
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_reference: paymentReference,
        });

        if (subError) throw subError;
      } else if (data.pricingModel === "percentage") {
        // Percentage plans don't require payment
        const { error: subError } = await supabase.from("seller_subscriptions").insert({
          seller_id: user?.id,
          plan: `percentage_${data.plan}`,
          price_monthly: 0,
          status: "active",
        });

        if (subError) throw subError;
      }

      // Mark onboarding as complete
      if (user?.id && data.sellerType) {
        const onboardingData = {
          ...data,
          completedSteps: sellerSteps.map((s) => s.id),
        };

        const success = await completeOnboarding(data.sellerType, onboardingData);

        if (!success) {
          console.error("Failed to mark onboarding as complete");
          toast({
            title: "Warning",
            description:
              "Onboarding completed but flag may not have been set. Please contact support if you see this message again.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Welcome to Blinno!",
        description: "Your seller account is ready. Start listing your products!",
      });
      navigate("/seller");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    data,
    user,
    becomeSeller,
    paymentStatus,
    paymentReference,
    sellerSteps,
    completeOnboarding,
    navigate,
    toast,
  ]);

  const handleSellerNext = useCallback(async () => {
    const currentStep = sellerSteps[sellerStepIndex];
    if (!currentStep) {
      return;
    }

    // Special handling for payment step - PaymentStep component handles its own buttons
    // This function should only be called for percentage plans (via onComplete)
    if (currentStep.id === "payment") {
      // If percentage plan, complete onboarding
      if (data.pricingModel === "percentage") {
        // Mark payment step as completed
        if (user?.id) {
          await completeStep(currentStep.id, data);
        }
        await handleSellerComplete();
      }
      // For subscription plans, PaymentStep will call onPaymentInitiate
      return;
    }

    // Special handling for category step - just check if sellerType is selected
    if (currentStep.id === "category") {
      if (!data.sellerType) {
        toast({
          title: "Validation Error",
          description: "Please select a seller type",
          variant: "destructive",
        });
        return;
      }
      // Category step has no fields, so we can skip field validation
    } else {
      // Validate current step
      const validation = validateStep(currentStep.id, data);
      if (!validation.valid) {
        toast({
          title: "Validation Error",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return;
      }
    }

    // Mark step as completed
    // For category step, include sellerType in stepData so it's saved to database
    if (user?.id) {
      const stepData = currentStep.id === "category" && data.sellerType
        ? { ...data, sellerType: data.sellerType }
        : data;
      await completeStep(currentStep.id, stepData);
    }

    // Check if this is the last step
    if (sellerStepIndex < sellerSteps.length - 1) {
      setSellerStepIndex((prev) => prev + 1);
    } else {
      // All steps completed - handle final completion
      await handleSellerComplete();
    }
  }, [sellerStepIndex, sellerSteps, data, user, completeStep, toast, handleSellerComplete]);

  const handleSellerBack = () => {
    if (sellerStepIndex > 0) {
      setSellerStepIndex((prev) => prev - 1);
    }
  };

  const handlePayment = async () => {
    if (!data.phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number for payment",
        variant: "destructive",
      });
      return;
    }

    if (!data.paymentNetwork) {
      toast({
        title: "Payment method required",
        description: "Please select a mobile money network",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    setPaymentStatus(null);
    pollCountRef.current = 0;

    try {
      const selectedPlan = data.plan;
      const subscriptionPrices: Record<string, number> = {
        starter: 25000,
        professional: 75000,
        enterprise: 250000,
      };
      const percentagePrices: Record<string, number> = {
        basic: 7,
        growth: 10,
        scale: 15,
      };

      const planPrice =
        data.pricingModel === "subscription"
          ? subscriptionPrices[selectedPlan] || 0
          : percentagePrices[selectedPlan] || 0;

      // Format phone number for ClickPesa (ensure it starts with 255)
      // ClickPesa requires format: 255XXXXXXXXX (no +, no spaces)
      let formattedPhone = data.phoneNumber.replace(/\D/g, ""); // Remove all non-digits
      if (formattedPhone.startsWith("0")) {
        // Convert 0XXXXXXXXX to 255XXXXXXXXX
        formattedPhone = "255" + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith("+255")) {
        // Remove + if present
        formattedPhone = formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("255")) {
        // If it doesn't start with 255, add it
        formattedPhone = "255" + formattedPhone;
      }

      // Validate phone number format (should be 12 digits: 255 + 9 digits)
      if (formattedPhone.length !== 12 || !formattedPhone.startsWith("255")) {
        throw new Error("Invalid phone number format. Please use format: +255 XXX XXX XXX or 0XXX XXX XXX");
      }

      const reference = `SUB-${user?.id?.slice(0, 8)}-${Date.now()}`;

      console.log("Initiating ClickPesa payment for subscription:", {
        amount: planPrice,
        phone: formattedPhone,
        network: data.paymentNetwork,
        reference,
      });

      const { data: paymentData, error } = await supabase.functions.invoke("clickpesa-payment", {
        body: {
          action: "initiate",
          amount: planPrice,
          currency: "TZS",
          phone_number: formattedPhone, // Use formatted phone number
          network: data.paymentNetwork || "MPESA",
          reference: reference,
          description: `Blinno ${selectedPlan} Plan Subscription`,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to connect to payment service");
      }

      if (paymentData?.success) {
        const transactionId = paymentData.data?.transaction_id || paymentData.data?.reference || reference;
        setPaymentReference(transactionId);
        setPaymentStatus("pending");

        toast({
          title: "Payment initiated",
          description: "Check your phone for the payment prompt. Please approve the payment to continue.",
        });

        setIsProcessingPayment(false);
      } else {
        throw new Error(paymentData?.error || "Payment failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "Could not process payment. Please try again.",
        variant: "destructive",
      });
      setPaymentStatus("failed");
      setIsProcessingPayment(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentReference || paymentStatus !== "pending") return;

    try {
      const { data: statusData, error } = await supabase.functions.invoke("clickpesa-payment", {
        body: {
          action: "check-status",
          reference: paymentReference,
        },
      });

      if (error) {
        console.error("Status check error:", error);
        return;
      }

      if (
        statusData?.data?.status === "COMPLETED" ||
        statusData?.data?.status === "PAYMENT_RECEIVED"
      ) {
        setPaymentStatus("completed");
        toast({
          title: "Payment confirmed!",
          description: "Your subscription is being activated...",
        });
        await handleSellerComplete();
      } else if (
        statusData?.data?.status === "FAILED" ||
        statusData?.data?.status === "CANCELLED" ||
        statusData?.data?.status === "PAYMENT_FAILED"
      ) {
        setPaymentStatus("failed");
        toast({
          title: "Payment failed",
          description: "The payment was not successful. Please try again.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  }, [paymentReference, paymentStatus, toast, handleSellerComplete]);

  // Poll for payment status
  useEffect(() => {
    if (!paymentReference || paymentStatus !== "pending") {
      pollCountRef.current = 0;
      return;
    }

    pollCountRef.current = 0;

    const interval = setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current > 24) {
        clearInterval(interval);
        setPaymentStatus("failed");
        toast({
          title: "Payment timeout",
          description: "Payment confirmation timed out. Please try again.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        return;
      }

      await checkPaymentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentReference, paymentStatus, checkPaymentStatus, toast]);


  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Buyer onboarding flow (simple, unchanged)
  if (data.role === "buyer") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i <= buyerStep ? "w-12 bg-primary" : "w-8 bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Role Selection */}
            {buyerStep === 1 && (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Badge variant="secondary" className="mb-4">
                    Step 1 of 3
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
                      <h3 className="text-xl font-semibold text-foreground mb-2">I want to Buy</h3>
                      <p className="text-muted-foreground text-sm">
                        Discover and purchase amazing products from sellers across Tanzania
                      </p>
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
                      <h3 className="text-xl font-semibold text-foreground mb-2">I want to Sell</h3>
                      <p className="text-muted-foreground text-sm">
                        Start your online business and reach customers across Tanzania
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Step 2: Buyer Interests */}
            {buyerStep === 2 && (
              <motion.div
                key="buyer-interests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Badge variant="secondary" className="mb-4">
                    Step 2 of 3
                  </Badge>
                  <h1 className="text-3xl font-bold text-foreground mb-2">What interests you?</h1>
                  <p className="text-muted-foreground">Select categories you're interested in</p>
                </div>

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
                        <span className="text-2xl mb-2 block">{interest.icon}</span>
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

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setBuyerStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={() => setBuyerStep(3)}
                    disabled={data.interests.length === 0}
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Buyer Confirmation */}
            {buyerStep === 3 && (
              <motion.div
                key="buyer-confirmation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Badge variant="secondary" className="mb-4">
                    Step 3 of 3
                  </Badge>
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">You're all set!</h1>
                  <p className="text-muted-foreground">
                    Start exploring products tailored just for you
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Type</span>
                        <span className="font-medium text-foreground capitalize">Buyer</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interests</span>
                        <span className="font-medium text-foreground">
                          {data.interests.length} selected
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setBuyerStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={handleBuyerComplete} disabled={isSubmitting}>
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Seller onboarding flow (using new multi-profile system)
  if (data.role === "seller") {
    const currentStep = sellerSteps[sellerStepIndex];
    const totalSellerSteps = sellerSteps.length;

    // If no steps loaded yet, show loading or role selection
    if (sellerSteps.length === 0) {
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
            {sellerSteps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i <= sellerStepIndex ? "w-12 bg-primary" : "w-8 bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {currentStep && (
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Badge variant="secondary" className="mb-4">
                    Step {sellerStepIndex + 1} of {totalSellerSteps}
                  </Badge>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{currentStep.title}</h1>
                  <p className="text-muted-foreground">{currentStep.description}</p>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <StepRenderer
                      step={currentStep}
                      data={data}
                      sellerType={data.sellerType}
                      onChange={handleSellerFieldChange}
                      onNext={handleSellerNext}
                      onBack={sellerStepIndex > 0 ? handleSellerBack : undefined}
                      onPaymentInitiate={handlePayment}
                      paymentStatus={paymentStatus}
                      isProcessingPayment={isProcessingPayment}
                    />
                  </CardContent>
                </Card>

                {/* Payment status display (if on payment step) */}
                {currentStep.id === "payment" && paymentStatus === "pending" && (
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-4">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Waiting for Payment</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Check your phone ({data.phoneNumber}) for the payment prompt and approve the
                        payment.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This page will automatically update when payment is confirmed.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {currentStep.id === "payment" && paymentStatus === "failed" && (
                  <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                    <CardContent className="p-6 text-center">
                      <h3 className="font-semibold text-foreground mb-2">Payment Failed</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        The payment was not successful. Please try again.
                      </p>
                      <Button onClick={handlePayment} variant="outline" size="sm">
                        Retry Payment
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Initial role selection (when role is null)
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">Step 1</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">How will you use Blinno?</h1>
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
              <h3 className="text-xl font-semibold text-foreground mb-2">I want to Buy</h3>
              <p className="text-muted-foreground text-sm">
                Discover and purchase amazing products from sellers across Tanzania
              </p>
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
              <h3 className="text-xl font-semibold text-foreground mb-2">I want to Sell</h3>
              <p className="text-muted-foreground text-sm">
                Start your online business and reach customers across Tanzania
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
