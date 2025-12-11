import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
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

          <h1 className="text-4xl font-bold mb-2 text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 8, 2024</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Blinno ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our marketplace platform. Please read this policy carefully.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.1 Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">We collect information you provide directly:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Name and contact information (email, phone number, address)</li>
                <li>Account credentials (email and password)</li>
                <li>Payment information (mobile money numbers)</li>
                <li>Profile information (bio, avatar, business details)</li>
                <li>Transaction history and order details</li>
                <li>Communications with us and other users</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Device information (browser type, operating system, device ID)</li>
                <li>IP address and location data</li>
                <li>Usage data (pages visited, time spent, click patterns)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.3 Seller-Specific Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Business name and registration details</li>
                <li>Product listings and inventory information</li>
                <li>Sales analytics and performance data</li>
                <li>Subscription and billing information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We use collected information to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related notifications</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Personalize your experience and provide recommendations</li>
                <li>Communicate about products, services, and promotions</li>
                <li>Analyze usage patterns and improve our Platform</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce our terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We may share your information with:</p>
              
              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">4.1 Other Users</h3>
              <p className="text-muted-foreground leading-relaxed">
                Buyers see seller profiles and product information. Sellers receive buyer shipping information to fulfill orders.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">4.2 Service Providers</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Payment processors (ClickPesa) for transaction processing</li>
                <li>Email service providers for communications</li>
                <li>Analytics providers for platform improvements</li>
                <li>Cloud hosting services for data storage</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">4.3 Legal Requirements</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may disclose information when required by law, legal process, or to protect the rights, property, or safety of Blinno, our users, or others.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and employee training</li>
                <li>Row-level security for database access</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain information for legal compliance, dispute resolution, and enforcement of our agreements. You may request deletion of your data by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent where applicable</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze site traffic and usage</li>
                <li>Personalize content and ads</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You can control cookies through your browser settings. Disabling cookies may limit some features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Third-Party Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Platform may contain links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Platform is not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than Tanzania. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Platform. Your continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions or concerns about this Privacy Policy or our data practices, contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-foreground font-medium">Blinno Privacy Team</p>
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
