import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function SellerAgreement() {
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

          <h1 className="text-4xl font-bold mb-2 text-foreground">Seller Agreement</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 8, 2024</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By registering as a seller on Blinno, you agree to be bound by this Seller Agreement in addition to our Terms of Service and Privacy Policy. This agreement governs your use of Blinno's seller services and tools.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Seller Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">To become a seller on Blinno, you must:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Be at least 18 years old</li>
                <li>Have a valid Blinno account</li>
                <li>Choose and maintain an active subscription plan</li>
                <li>Provide accurate business information</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Have the legal right to sell the products or services you list</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Subscription Plans</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Blinno offers three subscription plans for sellers:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Starter:</strong> 25,000 TZS/month - Up to 25 listings, 5% transaction fee</li>
                <li><strong className="text-foreground">Professional:</strong> 75,000 TZS/month - Up to 500 listings, 3% transaction fee</li>
                <li><strong className="text-foreground">Enterprise:</strong> 250,000 TZS/month - Unlimited listings, 1% transaction fee</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Subscription fees are billed monthly and are non-refundable. You may upgrade, downgrade, or cancel your subscription at any time, with changes taking effect at the start of the next billing cycle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Product Listings</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">As a seller, you agree to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate, complete, and truthful product descriptions</li>
                <li>Use high-quality images that accurately represent your products</li>
                <li>Set fair and competitive prices</li>
                <li>Maintain adequate inventory levels</li>
                <li>Update listings promptly when products are out of stock</li>
                <li>Not list prohibited or illegal items</li>
                <li>Respect intellectual property rights</li>
                <li>Comply with all applicable product safety standards</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Order Fulfillment</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You agree to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Process and ship orders within the timeframe specified in your listing</li>
                <li>Provide accurate shipping information and tracking numbers</li>
                <li>Ensure products are properly packaged and protected during shipping</li>
                <li>Respond to customer inquiries within 48 hours</li>
                <li>Handle returns and refunds according to Blinno's policies</li>
                <li>Resolve customer disputes in good faith</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Payments and Fees</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Blinno processes payments on your behalf. You agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Accept payments only through Blinno's payment system</li>
                <li>Pay applicable transaction fees based on your subscription plan</li>
                <li>Pay subscription fees on time</li>
                <li>Provide accurate payment and tax information</li>
                <li>Comply with all tax obligations in your jurisdiction</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Earnings will be deposited to your account after order completion, minus applicable fees. You may request withdrawals according to Blinno's withdrawal policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Prohibited Items and Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You may not sell:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Illegal or stolen goods</li>
                <li>Counterfeit or pirated items</li>
                <li>Weapons, explosives, or dangerous materials</li>
                <li>Drugs, pharmaceuticals, or medical devices (without proper authorization)</li>
                <li>Adult content or explicit material</li>
                <li>Items that infringe on intellectual property rights</li>
                <li>Items that violate local laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of content you create and upload to Blinno. However, by listing products on Blinno, you grant us a license to use, display, and distribute your content on the platform. You warrant that you have the right to grant such license and that your content does not infringe on any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Account Suspension and Termination</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Blinno reserves the right to suspend or terminate your seller account if you:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Violate this agreement or our Terms of Service</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Fail to fulfill orders or provide poor customer service</li>
                <li>List prohibited items</li>
                <li>Fail to pay subscription fees</li>
                <li>Receive multiple complaints or negative reviews</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Blinno acts as a platform connecting buyers and sellers. We are not responsible for the quality, safety, or legality of items you list, nor are we responsible for the accuracy of your listings. You are solely responsible for your products, listings, and customer relationships.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to This Agreement</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may modify this Seller Agreement at any time. We will notify you of material changes via email or through the platform. Continued use of Blinno's seller services after changes constitutes acceptance of the modified agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For questions about this Seller Agreement, please contact us:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-foreground font-medium">Blinno Seller Support</p>
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

