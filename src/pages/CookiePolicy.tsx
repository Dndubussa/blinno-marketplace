import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function CookiePolicy() {
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

          <h1 className="text-4xl font-bold mb-2 text-foreground">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 8, 2024</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners. Blinno uses cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Types of Cookies We Use</h2>
              
              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.1 Essential Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Authentication cookies to keep you logged in</li>
                <li>Session cookies to maintain your shopping cart</li>
                <li>Security cookies to protect against fraud</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.2 Performance Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Analytics cookies to track page views and user behavior</li>
                <li>Performance monitoring cookies</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.3 Functionality Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These cookies allow the website to remember choices you make and provide enhanced, personalized features.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Preference cookies to remember your settings</li>
                <li>Language and region preferences</li>
                <li>User interface customization</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.4 Marketing Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These cookies are used to track visitors across websites to display relevant advertisements.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Advertising cookies to deliver relevant ads</li>
                <li>Social media cookies for sharing content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We use cookies to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Keep you signed in and maintain your session</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze how you use our website to improve our services</li>
                <li>Provide personalized content and recommendations</li>
                <li>Measure the effectiveness of our marketing campaigns</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics and deliver advertisements. These third parties may include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Analytics providers (e.g., Google Analytics)</li>
                <li>Payment processors (Flutterwave)</li>
                <li>Social media platforms</li>
                <li>Advertising networks</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to accept or reject cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer. However, this may prevent you from taking full advantage of our website.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can manage cookies through your browser settings:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Chrome: Settings → Privacy and Security → Cookies</li>
                <li>Firefox: Options → Privacy & Security → Cookies and Site Data</li>
                <li>Safari: Preferences → Privacy → Cookies</li>
                <li>Edge: Settings → Privacy, Search, and Services → Cookies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Cookie Duration</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Cookies may be either "persistent" or "session" cookies:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Session cookies</strong> are temporary and expire when you close your browser</li>
                <li><strong className="text-foreground">Persistent cookies</strong> remain on your device until they expire or are deleted</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about our use of cookies, please contact us:
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

