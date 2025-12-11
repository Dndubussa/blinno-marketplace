import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Mail, FileText, Image } from "lucide-react";

export default function Press() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Button
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <h1 className="text-4xl font-bold mb-2 text-foreground">Press</h1>
          <p className="text-muted-foreground mb-8">Media resources and press inquiries</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Press Inquiries</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For media inquiries, interview requests, or press releases, please contact our press team. We're happy to provide information, arrange interviews, and share our story.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium mb-1">Press Contact</p>
                    <p className="text-muted-foreground">Email: support@blinno.app</p>
                    <p className="text-muted-foreground text-sm mt-2">We typically respond within 24-48 hours.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">About Blinno</h2>
              <p className="text-muted-foreground leading-relaxed">
                Blinno is Tanzania's everything marketplace—a unified platform that empowers creators, sellers, and businesses to sell products, courses, services, and digital content. Founded with a vision to break down barriers in e-commerce, Blinno supports multiple categories including physical products, e-books, courses, creative content, restaurants, lodging, and events.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Key Facts</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Multi-category marketplace supporting 6+ product types</li>
                <li>Integrated mobile money payment solutions (M-Pesa, Airtel Money, etc.)</li>
                <li>Subscription-based seller plans with flexible pricing</li>
                <li>Comprehensive seller tools including analytics and storefront management</li>
                <li>Based in Dar es Salaam, Tanzania</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Media Resources</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We provide the following resources for media use:
              </p>
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div className="p-4 bg-muted rounded-lg">
                  <FileText className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">Press Kit</h3>
                  <p className="text-sm text-muted-foreground">Company information, facts, and key statistics</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Image className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">Logo & Assets</h3>
                  <p className="text-sm text-muted-foreground">High-resolution logos and brand assets</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mt-4">
                To request media resources, please email support@blinno.app with your request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Recent News</h2>
              <p className="text-muted-foreground leading-relaxed">
                Stay tuned for updates on Blinno's growth, new features, and marketplace milestones. For the latest news and announcements, follow us on social media or subscribe to our newsletter.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

