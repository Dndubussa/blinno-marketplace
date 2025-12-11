import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
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

          <h1 className="text-4xl font-bold mb-2 text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 8, 2024</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using Blinno ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all users, including buyers, sellers, and visitors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                Blinno is a multi-category marketplace platform that connects buyers and sellers. We provide a platform for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Physical product sales (clothing, perfumes, home appliances, kitchenware)</li>
                <li>Digital products (e-books, printed books)</li>
                <li>Creative content from musicians and content creators</li>
                <li>Handmade goods from artisans</li>
                <li>Educational courses with video and live classes</li>
                <li>Restaurant and food services</li>
                <li>Lodging and accommodation services</li>
                <li>News and media content</li>
                <li>Event organization and ticketing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To use certain features of the Platform, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Be at least 18 years old to create an account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Buyer Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">As a buyer on Blinno, you agree to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Pay for products and services in full at the time of purchase</li>
                <li>Provide accurate shipping and payment information</li>
                <li>Review product descriptions carefully before purchasing</li>
                <li>Communicate respectfully with sellers</li>
                <li>Report any issues with orders within 14 days of delivery</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Seller Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">As a seller on Blinno, you agree to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate product descriptions and images</li>
                <li>Fulfill orders within the stated timeframe</li>
                <li>Maintain adequate inventory levels</li>
                <li>Respond to customer inquiries within 48 hours</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Pay applicable fees according to your subscription plan</li>
                <li>Not sell prohibited or illegal items</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Payments and Fees</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All payments are processed through our secure payment provider, ClickPesa. We support:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>M-Pesa (Vodacom)</li>
                <li>Tigo Pesa</li>
                <li>Airtel Money</li>
                <li>Halopesa</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Sellers may choose between subscription-based pricing or percentage-based commission on sales. All fees are non-refundable unless otherwise stated.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You may not use the Platform to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Sell counterfeit, stolen, or illegal goods</li>
                <li>Infringe on intellectual property rights</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Spread malware or engage in phishing</li>
                <li>Manipulate reviews or ratings</li>
                <li>Circumvent our payment system</li>
                <li>Create multiple accounts for fraudulent purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Platform and its original content, features, and functionality are owned by Blinno and are protected by international copyright, trademark, and other intellectual property laws. Users retain ownership of content they upload but grant Blinno a license to use, display, and distribute such content on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Blinno acts as an intermediary between buyers and sellers. We are not responsible for the quality, safety, or legality of items listed, the accuracy of listings, or the ability of sellers to complete sales. To the maximum extent permitted by law, Blinno shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                We encourage users to resolve disputes directly. If a resolution cannot be reached, Blinno may intervene to help mediate. For unresolved disputes, binding arbitration shall be conducted in Dar es Salaam, Tanzania, under the rules of the Tanzania Arbitration Association.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the Platform will cease immediately. Sellers will receive any pending payments minus applicable fees.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Platform. Continued use of the Platform after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-foreground font-medium">Blinno Support</p>
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
