import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function About() {
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

          <h1 className="text-4xl font-bold mb-2 text-foreground">About Us</h1>
          <p className="text-muted-foreground mb-8">Learn more about Blinno and our mission</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Blinno is the everything marketplace—a unified platform designed to empower creators, sellers, and businesses to reach their full potential. We believe that everyone should have the opportunity to sell, create, and grow their business, regardless of their size or industry.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">What We Do</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Blinno provides a comprehensive marketplace platform that supports multiple categories:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Physical products from verified sellers</li>
                <li>Digital products including e-books and printed books</li>
                <li>Creative content from musicians, artists, and content creators</li>
                <li>Educational courses with video and live class support</li>
                <li>Restaurant and food services</li>
                <li>Lodging and accommodation services</li>
                <li>Events, media, and news content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Values</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Empowerment</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We empower individuals and businesses to succeed by providing the tools and platform they need to reach customers and grow their business.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Innovation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We continuously innovate to provide the best marketplace experience, integrating modern payment solutions and user-friendly features.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Trust & Safety</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We prioritize the safety and security of our users, implementing robust security measures and verification processes.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Accessibility</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We make e-commerce accessible to everyone, supporting local payment methods and providing tools for sellers of all sizes.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed">
                Blinno was founded with a vision to create a unified marketplace that breaks down barriers between different types of sellers and buyers. We recognized that traditional e-commerce platforms often silo different product types, making it difficult for creators, service providers, and product sellers to reach their audiences.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Today, Blinno serves as a comprehensive platform where sellers can list products, courses, services, and digital content all in one place, while buyers can discover everything they need from a single marketplace.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Have questions or want to learn more? We'd love to hear from you.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-foreground font-medium">Blinno Team</p>
                <p className="text-muted-foreground">Email: support@blinno.app</p>
                <p className="text-muted-foreground">Phone: +255 690 283 015</p>
                <p className="text-muted-foreground">Address: Dar es Salaam, Tanzania</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

