import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("newsletter-subscribe", {
        body: { email, name },
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Welcome to our newsletter!");
      setEmail("");
      setName("");
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-border rounded-2xl p-8 text-center shadow-sm"
      >
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-foreground mb-2">You're In!</h3>
        <p className="text-muted-foreground">
          Check your inbox for a welcome email from us.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-primary/5 border border-primary/10 rounded-2xl p-8 md:p-12"
    >
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Stay in the Loop
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          Subscribe to our newsletter for exclusive deals, new arrivals, and special offers.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
          <div className="flex-1 space-y-3 sm:space-y-0 sm:flex sm:gap-3">
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-border text-foreground"
            />
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white border-border text-foreground"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-white px-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subscribing...
              </>
            ) : (
              "Subscribe"
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4">
          By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
        </p>
      </div>
    </motion.div>
  );
};

export default NewsletterSignup;
