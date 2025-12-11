import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, CheckCircle, Store, ShoppingBag, Heart, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  position: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    target: "navbar",
    title: "Welcome to Blinno! 🎉",
    content: "We're excited to have you here! Let us give you a quick tour of the platform.",
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    position: "bottom",
  },
  {
    target: "categories",
    title: "Explore Categories",
    content: "Browse through products, e-books, courses, services, and events. There's something for everyone!",
    icon: <Search className="h-6 w-6 text-primary" />,
    position: "bottom",
  },
  {
    target: "wishlist",
    title: "Save Your Favorites",
    content: "Found something you love? Add it to your wishlist and come back to it later.",
    icon: <Heart className="h-6 w-6 text-primary" />,
    position: "bottom",
  },
  {
    target: "cart",
    title: "Easy Checkout",
    content: "Add items to your cart and checkout securely with M-Pesa, Visa, Mastercard, and more.",
    icon: <ShoppingBag className="h-6 w-6 text-primary" />,
    position: "bottom",
  },
  {
    target: "profile",
    title: "Your Dashboard",
    content: "Access your orders, payments, and settings from your personal dashboard.",
    icon: <User className="h-6 w-6 text-primary" />,
    position: "bottom",
  },
  {
    target: "seller",
    title: "Start Selling",
    content: "Ready to sell? Create your store and reach thousands of customers across East Africa!",
    icon: <Store className="h-6 w-6 text-primary" />,
    position: "bottom",
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    setIsVisible(isOpen);
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
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

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

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
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-primary"
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
                {/* Icon */}
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
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
                <div className="flex items-center justify-center gap-2 mt-8">
                  {tourSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "w-8 bg-primary"
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
                    {currentStep === tourSteps.length - 1 ? (
                      <>
                        Get Started
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

// Hook to manage tour state
export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("blinno_onboarding_tour_completed");
    const isNewUser = localStorage.getItem("blinno_new_user_signup");
    
    if (isNewUser && !hasSeenTour) {
      // Delay showing tour for smooth page load
      const timer = setTimeout(() => {
        setShowTour(true);
        localStorage.removeItem("blinno_new_user_signup");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = () => setShowTour(true);
  const closeTour = () => setShowTour(false);
  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem("blinno_onboarding_tour_completed", "true");
  };

  return { showTour, startTour, closeTour, completeTour };
}
