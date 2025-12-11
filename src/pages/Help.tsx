import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Search, MessageCircle, Book, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Help() {
  const navigate = useNavigate();

  const helpCategories = [
    {
      title: "Getting Started",
      icon: Book,
      topics: [
        "How to create an account",
        "Setting up your profile",
        "First steps as a buyer",
        "First steps as a seller",
      ],
    },
    {
      title: "Buying on Blinno",
      icon: MessageCircle,
      topics: [
        "How to search for products",
        "Placing an order",
        "Payment methods",
        "Order tracking",
        "Returns and refunds",
      ],
    },
    {
      title: "Selling on Blinno",
      icon: Video,
      topics: [
        "Creating product listings",
        "Managing inventory",
        "Processing orders",
        "Withdrawing earnings",
        "Subscription plans",
      ],
    },
  ];

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "Click on 'Sign Up' in the top right corner, enter your email and password, and verify your email address. You'll automatically be set up as a buyer and can upgrade to seller later.",
    },
    {
      question: "What payment methods are accepted?",
      answer: "Blinno supports mobile money payments including M-Pesa, Airtel Money, Halopesa, and Mixx by Yas. Payments are processed securely through ClickPesa.",
    },
    {
      question: "How do I become a seller?",
      answer: "After creating an account, you can become a seller by clicking 'Become a Seller' in your profile. You'll need to choose a subscription plan (Starter, Professional, or Enterprise) to start listing products.",
    },
    {
      question: "How long does it take to receive my order?",
      answer: "Delivery times vary depending on the seller and your location. Sellers typically ship within 2-5 business days. You can track your order status in your dashboard.",
    },
    {
      question: "What are the seller subscription fees?",
      answer: "Starter plan is 25,000 TZS/month with 5% transaction fee, Professional is 75,000 TZS/month with 3% fee, and Enterprise is 250,000 TZS/month with 1% fee.",
    },
    {
      question: "How do I contact a seller?",
      answer: "You can message sellers directly through the messaging system. Click on a seller's profile or product page and use the 'Contact Seller' button to start a conversation.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <Button
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">Help Center</h1>
            <p className="text-muted-foreground mb-6">Find answers to common questions and learn how to use Blinno</p>
            
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help articles..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {helpCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <category.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {category.topics.map((topic, topicIndex) => (
                      <li key={topicIndex}>• {topic}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <Card className="bg-muted">
            <CardHeader>
              <CardTitle>Still need help?</CardTitle>
              <CardDescription>Can't find what you're looking for? Contact our support team.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" onClick={() => navigate("/contact")}>
                  Contact Support
                </Button>
                <Button variant="outline" onClick={() => navigate("/community")}>
                  Visit Community
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

