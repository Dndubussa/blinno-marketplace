import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Shield, Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Safety() {
  const navigate = useNavigate();

  const safetyFeatures = [
    {
      icon: Shield,
      title: "Secure Payments",
      description: "All payments are processed through Flutterwave, a trusted payment provider with industry-standard security.",
    },
    {
      icon: Lock,
      title: "Data Protection",
      description: "Your personal information is encrypted and protected using advanced security measures.",
    },
    {
      icon: CheckCircle,
      title: "Verified Sellers",
      description: "We verify seller accounts and monitor listings to ensure authenticity and quality.",
    },
    {
      icon: AlertTriangle,
      title: "Report Issues",
      description: "Report suspicious activity, fraudulent listings, or safety concerns directly to our team.",
    },
  ];

  const safetyTips = [
    {
      title: "For Buyers",
      tips: [
        "Always review seller ratings and reviews before purchasing",
        "Read product descriptions carefully",
        "Use secure payment methods (never share payment details directly)",
        "Keep communication within Blinno's messaging system",
        "Report any suspicious activity immediately",
      ],
    },
    {
      title: "For Sellers",
      tips: [
        "Keep your account credentials secure",
        "Verify buyer information before shipping",
        "Use Blinno's official payment system only",
        "Respond to customer inquiries promptly",
        "Follow Blinno's seller guidelines and policies",
      ],
    },
  ];

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

          <h1 className="text-4xl font-bold mb-2 text-foreground">Safety & Security</h1>
          <p className="text-muted-foreground mb-8">Your safety is our priority. Learn how we protect you and your information.</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Commitment to Safety</h2>
              <p className="text-muted-foreground leading-relaxed">
                At Blinno, we take safety and security seriously. We implement multiple layers of protection to ensure a safe and trustworthy marketplace experience for all users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Safety Features</h2>
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                {safetyFeatures.map((feature, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <feature.icon className="h-6 w-6 text-primary mb-2" />
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Safety Tips</h2>
              <div className="space-y-6">
                {safetyTips.map((section, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                        {section.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>{tip}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Reporting Issues</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you encounter any safety concerns, fraudulent activity, or suspicious listings, please report it immediately. Our team reviews all reports and takes appropriate action.
              </p>
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <p className="text-foreground font-medium mb-2">How to Report</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                    <li>Click the "Report" button on any listing or user profile</li>
                    <li>Contact our support team at support@blinno.app</li>
                    <li>Use the contact form on our Contact page</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Security Best Practices</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Use a strong, unique password for your Blinno account</li>
                <li>Enable two-factor authentication if available</li>
                <li>Never share your account credentials with anyone</li>
                <li>Log out when using shared devices</li>
                <li>Keep your contact information up to date</li>
                <li>Review your account activity regularly</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Safety Team</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For safety-related concerns or questions, contact our dedicated safety team.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-foreground font-medium mb-2">Safety & Security Team</p>
                <p className="text-muted-foreground">Email: support@blinno.app</p>
                <p className="text-muted-foreground text-sm mt-2">We respond to safety reports within 24 hours.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

