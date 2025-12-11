import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  const navigate = useNavigate();
  
  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-24 lg:pt-40 lg:pb-32">
      {/* Subtle gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, hsl(210 40% 98%) 0%, hsl(0 0% 100%) 50%, hsl(210 40% 98%) 100%)",
        }}
      />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2.5"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">The Everything Marketplace</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-tight"
          >
            One platform to{" "}
            <span className="text-primary">sell, create,</span>
            <br />
            and grow your business
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
          >
            From physical products to digital courses, from restaurant menus to live events, Blinno empowers everyone to turn their passion into profit.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button 
              size="lg" 
              className="h-14 px-8 text-base font-semibold rounded-xl shadow-lg shadow-primary/25"
              onClick={() => navigate("/sign-up")}
            >
              Start Selling Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-8 text-base font-semibold rounded-xl border-2"
              onClick={() => navigate("/products")}
            >
              Explore Marketplace
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
