import { motion } from "framer-motion";
import { 
  Shield, 
  Zap, 
  Globe, 
  CreditCard, 
  BarChart3, 
  Headphones 
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure Payments",
    description: "End-to-end encryption and fraud protection for every transaction.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized infrastructure ensures your store loads in milliseconds.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Sell to customers in 120+ countries with multi-currency support.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payouts",
    description: "Get paid your way — bank transfer, mobile money, or crypto.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "AI-powered insights to optimize your sales and grow faster.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our team is always here to help you succeed on your journey.",
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Why Blinno
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for modern <span className="text-primary">entrepreneurs</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every feature is designed to help you focus on what matters most — 
            growing your business and delighting your customers.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
