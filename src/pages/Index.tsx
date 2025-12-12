import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { PartnersSection } from "@/components/PartnersSection";
import { StatsSection } from "@/components/StatsSection";
import { CategoriesSection } from "@/components/CategoriesSection";
import { FeaturedProductsSection } from "@/components/FeaturedProductsSection";
import { CustomerReviewsSection } from "@/components/CustomerReviewsSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import NewsletterSignup from "@/components/NewsletterSignup";
import { OnboardingTour, useOnboardingTour } from "@/components/OnboardingTour";
import { useAuth } from "@/hooks/useAuth";
import { getAuthRedirectPath } from "@/lib/authRedirect";

const Index = () => {
  const { showTour, closeTour, completeTour } = useOnboardingTour();
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!loading && user) {
      const redirectPath = getAuthRedirectPath(roles);
      // Only redirect if we're on the landing page (not if user explicitly navigated here)
      if (location.pathname === "/") {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, loading, roles, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <PartnersSection />
        <StatsSection />
        <CategoriesSection />
        <FeaturedProductsSection />
        <CustomerReviewsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <section className="py-20 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <NewsletterSignup />
        </section>
        <CTASection />
      </main>
      <Footer />
      <OnboardingTour isOpen={showTour} onClose={closeTour} onComplete={completeTour} />
    </div>
  );
};

export default Index;
