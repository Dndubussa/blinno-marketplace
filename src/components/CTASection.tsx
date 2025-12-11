import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const navigate = useNavigate();
  
  return (
    <section className="relative overflow-hidden bg-primary py-24 lg:py-32">
      <div className="container relative mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to grow your business?
          </h2>
          <p className="mt-6 text-lg text-white/80">
            Join thousands of sellers who trust Blinno to power their online presence. 
            Start for free and scale as you grow.
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button 
              size="lg" 
              className="h-14 bg-white text-primary hover:bg-white/90 px-8 text-base font-semibold rounded-xl shadow-lg"
              onClick={() => navigate("/sign-up")}
            >
              Create Your Store
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 border-2 border-white/30 bg-transparent text-white hover:bg-white/10 px-8 text-base font-semibold rounded-xl"
            >
              Talk to Sales
            </Button>
          </motion.div>
          
          <p className="mt-6 text-sm text-white/60">
            Free to start • No credit card required • Setup in minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
