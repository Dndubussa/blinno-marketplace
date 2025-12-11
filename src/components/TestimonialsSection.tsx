import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Fashion Boutique Owner",
    avatar: "SJ",
    content: "Blinno transformed my small fashion business. Within 6 months, I went from local sales to shipping internationally. The platform handles everything seamlessly.",
    rating: 5,
    category: "Products",
  },
  {
    name: "Marcus Chen",
    role: "Course Creator & Educator",
    avatar: "MC",
    content: "As an online educator, I needed a platform that could handle video courses and live classes. Blinno exceeded my expectations with their robust teaching tools.",
    rating: 5,
    category: "Courses",
  },
  {
    name: "Amira Okonkwo",
    role: "Independent Author",
    avatar: "AO",
    content: "Publishing my e-books through Blinno was incredibly easy. The royalty rates are fair, and I love the direct connection with my readers.",
    rating: 5,
    category: "Books",
  },
  {
    name: "David Rodriguez",
    role: "Restaurant Owner",
    avatar: "DR",
    content: "Managing reservations, orders, and deliveries from one dashboard has revolutionized how we run our restaurant. Customer satisfaction is at an all-time high.",
    rating: 5,
    category: "Services",
  },
  {
    name: "Lena Müller",
    role: "Music Producer",
    avatar: "LM",
    content: "Selling my beats and music tracks directly to artists worldwide has never been easier. Blinno's creator tools are exactly what independent musicians need.",
    rating: 5,
    category: "Creators",
  },
  {
    name: "James Okafor",
    role: "Event Organizer",
    avatar: "JO",
    content: "From ticketing to promotion, Blinno has all the tools I need to run successful events. The analytics help me understand my audience better.",
    rating: 5,
    category: "Events",
  },
];

export function TestimonialsSection() {
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
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Loved by <span className="text-primary">entrepreneurs</span> worldwide
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Hear from sellers, creators, and businesses who have grown with Blinno.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative rounded-2xl border border-border bg-white p-6 shadow-sm"
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-primary/10" />
              
              <div className="flex items-center gap-1 text-primary">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              
              <p className="mt-4 text-muted-foreground">
                "{testimonial.content}"
              </p>
              
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
              
              <div className="mt-4">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {testimonial.category}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
