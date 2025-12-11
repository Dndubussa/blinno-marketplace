import { motion } from "framer-motion";
import { UserPlus, Store, Rocket, BadgeDollarSign } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    description: "Sign up in seconds with email or social login. Choose whether you're a buyer, seller, or both.",
  },
  {
    icon: Store,
    step: "02",
    title: "Set Up Your Store",
    description: "Customize your storefront, add products or services, set pricing, and configure payment options.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Launch & Promote",
    description: "Go live instantly. Use our built-in marketing tools to reach millions of potential customers.",
  },
  {
    icon: BadgeDollarSign,
    step: "04",
    title: "Earn & Grow",
    description: "Receive secure payments, track analytics, and scale your business with our growth tools.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-muted/30 py-24 lg:py-32">
      <div className="container relative mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Getting Started
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            How <span className="text-primary">Blinno</span> Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start selling or buying in minutes. Our streamlined process makes it 
            easy for anyone to join the marketplace.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-0.5 w-full translate-x-1/2 bg-gradient-to-r from-primary/30 to-transparent lg:block" />
              )}
              
              <div className="relative rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-4xl font-bold text-muted-foreground/20">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
