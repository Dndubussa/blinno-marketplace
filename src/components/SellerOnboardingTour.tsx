import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, CheckCircle, Package, ShoppingCart, BarChart3, Settings, Wallet, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const sellerTourSteps: TourStep[] = [
  {
    title: "Welcome to Seller Hub! 🚀",
    content: "Congratulations on becoming a Blinno seller! Let's walk you through the tools to grow your business.",
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
  },
  {
    title: "Manage Your Products",
    content: "Add, edit, and organize your products. Upload images, set prices, and manage inventory all in one place.",
    icon: <Package className="h-6 w-6 text-primary" />,
  },
  {
    title: "Track Orders",
    content: "View and manage customer orders. Update order status and keep your buyers informed with real-time updates.",
    icon: <ShoppingCart className="h-6 w-6 text-primary" />,
  },
  {
    title: "Shipping & Delivery",
    content: "Set up shipping options, add tracking numbers, and notify customers about their delivery status.",
    icon: <Truck className="h-6 w-6 text-primary" />,
  },
  {
    title: "Payments & Earnings",
    content: "Track your earnings, view payment history, and receive payouts directly to your M-Pesa or bank account.",
    icon: <Wallet className="h-6 w-6 text-primary" />,
  },
  {
    title: "Analytics Dashboard",
    content: "Monitor your performance with detailed sales reports, customer insights, and revenue trends.",
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
  },
  {
    title: "Customer Reviews",
    content: "Build trust with customer reviews. Respond to feedback and maintain a stellar seller rating.",
    icon: <Star className="h-6 w-6 text-primary" />,
  },
  {
    title: "Store Settings",
    content: "Customize your store profile, set business hours, and configure notifications to your preference.",
    icon: <Settings className="h-6 w-6 text-primary" />,
  },
];

interface SellerOnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function SellerOnboardingTour({ isOpen, onClose, onComplete }: SellerOnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    setIsVisible(isOpen);
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < sellerTourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onClose();
  };

  const step = sellerTourSteps[currentStep];
  const progress = ((currentStep + 1) / sellerTourSteps.length) * 100;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={handleSkip}
          />

          {/* Tour Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
          >
            <div className="bg-card rounded-2xl shadow-2xl overflow-hidden mx-4 border border-border">
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Content */}
              <div className="p-8">
                {/* Step counter */}
                <div className="text-xs font-medium text-muted-foreground text-center mb-4">
                  Step {currentStep + 1} of {sellerTourSteps.length}
                </div>

                {/* Icon */}
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-6"
                >
                  {step.icon}
                </motion.div>

                {/* Title & Content */}
                <motion.div
                  key={`content-${currentStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.content}
                  </p>
                </motion.div>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-1.5 mt-8">
                  {sellerTourSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "w-6 bg-primary"
                          : index < currentStep
                          ? "w-2 bg-primary/60"
                          : "w-2 bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <Button onClick={handleNext}>
                    {currentStep === sellerTourSteps.length - 1 ? (
                      <>
                        Start Selling
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Skip link */}
                <button
                  onClick={handleSkip}
                  className="block w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
                >
                  Skip tour
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to manage seller tour state
export function useSellerOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("blinno_seller_onboarding_completed");
    const isNewSeller = localStorage.getItem("blinno_new_seller");
    
    if (isNewSeller && !hasSeenTour) {
      const timer = setTimeout(() => {
        setShowTour(true);
        localStorage.removeItem("blinno_new_seller");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = () => setShowTour(true);
  const closeTour = () => setShowTour(false);
  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem("blinno_seller_onboarding_completed", "true");
  };

  return { showTour, startTour, closeTour, completeTour };
}
