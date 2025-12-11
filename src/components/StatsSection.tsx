import { motion } from "framer-motion";
import { TrendingUp, Users, Globe, ShieldCheck } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "50,000+",
    label: "Active Sellers",
    description: "Entrepreneurs growing their business",
  },
  {
    icon: TrendingUp,
    value: "$10M+",
    label: "Transactions",
    description: "Processed securely each month",
  },
  {
    icon: Globe,
    value: "120+",
    label: "Countries",
    description: "Global reach for your products",
  },
  {
    icon: ShieldCheck,
    value: "99.9%",
    label: "Uptime",
    description: "Reliable platform you can trust",
  },
];

export function StatsSection() {
  return (
    <section className="bg-white py-20 lg:py-28 border-y border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Trusted Platform
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Numbers that speak for themselves
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="font-display text-4xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {stat.label}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
