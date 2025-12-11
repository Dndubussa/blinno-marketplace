import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I start selling on Blinno?",
    answer: "Getting started is easy! Simply create a free account, set up your seller profile, and start listing your products or services. Our onboarding wizard will guide you through each step. You can be selling within minutes.",
  },
  {
    question: "What types of products can I sell?",
    answer: "Blinno supports a wide variety of categories including physical products (clothing, electronics, home goods), digital products (e-books, courses, music), services (restaurant reservations, accommodations), and event tickets. We welcome all legal goods and services.",
  },
  {
    question: "What are the fees and commissions?",
    answer: "Our Starter plan is free with a 2.9% + $0.30 transaction fee. Professional plans reduce this to 1.9% + $0.30 with a $29/month subscription. Enterprise clients receive custom pricing based on volume. There are no hidden fees.",
  },
  {
    question: "How do I receive payments?",
    answer: "We support multiple payout methods including bank transfer, PayPal, mobile money (in supported regions), and cryptocurrency. Payouts are processed weekly by default, with daily payouts available for Professional and Enterprise sellers.",
  },
  {
    question: "Can I host live classes and webinars?",
    answer: "Yes! Our platform includes built-in video conferencing for live classes, webinars, and one-on-one sessions. Educators and creators can schedule live events, share screens, and interact with students in real-time.",
  },
  {
    question: "Is there customer support available?",
    answer: "Absolutely. Starter users have access to our help center and community forums. Professional users get priority email support, while Enterprise clients receive dedicated account managers and 24/7 phone support.",
  },
  {
    question: "Can I use my own domain name?",
    answer: "Professional and Enterprise sellers can connect custom domains to their storefronts. We provide free SSL certificates and handle all technical setup for you.",
  },
  {
    question: "How does Blinno protect buyers and sellers?",
    answer: "We use end-to-end encryption for all transactions, provide buyer protection guarantees, and have a robust dispute resolution system. Sellers are verified, and we monitor for fraudulent activity 24/7.",
  },
];

export function FAQSection() {
  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-32">
      <div className="container relative mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about getting started with Blinno.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-12 max-w-3xl"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-border bg-white px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
