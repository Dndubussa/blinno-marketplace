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

const Index = () => {
  const { showTour, closeTour, completeTour } = useOnboardingTour();

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
