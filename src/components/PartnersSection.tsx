import { motion } from "framer-motion";

import airtelMoney from "@/assets/partners/airtel-money.png";
import halopesa from "@/assets/partners/halopesa.png";
import mastercard from "@/assets/partners/mastercard.png";
import mixxByYas from "@/assets/partners/mixx-by-yas.png";
import mpesa from "@/assets/partners/mpesa.png";
import visa from "@/assets/partners/visa.png";

const partners = [
  { name: "M-Pesa", logo: mpesa, size: "large" }, // Twice the size
  { name: "Visa", logo: visa, size: "normal" },
  { name: "Mastercard", logo: mastercard, size: "normal" },
  { name: "Airtel Money", logo: airtelMoney, size: "medium" }, // Once (slightly larger)
  { name: "Halopesa", logo: halopesa, size: "normal" },
  { name: "Mixx by Yas", logo: mixxByYas, size: "large" }, // Twice the size
];

// Duplicate for seamless loop
const allPartners = [...partners, ...partners];

export function PartnersSection() {
  return (
    <section className="relative bg-white py-16 lg:py-20 overflow-hidden">
      <div className="container relative mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Trusted Payment Partners
          </p>
        </motion.div>
      </div>

      {/* Sliding Partners Container */}
      <div className="mt-10 relative">
        {/* Gradient fade on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />

        {/* Sliding animation container */}
        <motion.div
          className="flex items-center gap-16"
          animate={{ x: [0, -50 * partners.length * 3] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
          style={{ width: "fit-content" }}
        >
          {allPartners.map((partner, index) => {
            // Determine size classes based on partner size
            const sizeClasses = {
              large: "h-24 w-auto max-w-[280px]", // Twice the size (2x)
              medium: "h-16 w-auto max-w-[180px]", // Once (1.33x)
              normal: "h-12 w-auto max-w-[140px]", // Default size
            };
            
            const size = (partner as typeof partner & { size?: "large" | "medium" | "normal" }).size || "normal";
            const containerHeight = size === "large" ? "h-28" : size === "medium" ? "h-20" : "h-16";
            
            return (
              <div
                key={`${partner.name}-${index}`}
                className={`flex ${containerHeight} items-center justify-center px-6 shrink-0`}
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className={`${sizeClasses[size]} object-contain opacity-80 hover:opacity-100 transition-opacity duration-300`}
                />
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
