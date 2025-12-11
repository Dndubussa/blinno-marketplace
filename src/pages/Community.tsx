import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Users, MessageSquare, Heart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Community() {
  const navigate = useNavigate();

  const communityFeatures = [
    {
      icon: Users,
      title: "Connect with Others",
      description: "Join discussions with buyers, sellers, and creators from across Tanzania.",
    },
    {
      icon: MessageSquare,
      title: "Share Experiences",
      description: "Share tips, ask questions, and learn from the community.",
    },
    {
      icon: Heart,
      title: "Support Each Other",
      description: "Help fellow community members and get help when you need it.",
    },
    {
      icon: TrendingUp,
      title: "Stay Updated",
      description: "Get the latest news, updates, and announcements from Blinno.",
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

          <h1 className="text-4xl font-bold mb-2 text-foreground">Community</h1>
          <p className="text-muted-foreground mb-8">Join the Blinno community and connect with fellow users</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Welcome to the Blinno Community</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Blinno community is a space for buyers, sellers, creators, and entrepreneurs to connect, share knowledge, and support each other. Whether you're just starting out or have been selling for years, there's a place for you here.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">What You Can Do</h2>
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                {communityFeatures.map((feature, index) => (
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
              <h2 className="text-2xl font-semibold text-foreground mb-4">Community Guidelines</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To ensure a positive experience for everyone, please follow these guidelines:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Be respectful and kind to all community members</li>
                <li>Share helpful and accurate information</li>
                <li>Respect others' privacy and intellectual property</li>
                <li>No spam, self-promotion, or off-topic content</li>
                <li>Report any inappropriate behavior</li>
                <li>Follow Blinno's Terms of Service and Privacy Policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Get Involved</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Blinno community is growing every day. Join us to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Participate in discussions and forums</li>
                <li>Attend virtual events and workshops</li>
                <li>Share your success stories</li>
                <li>Get feedback on your listings and products</li>
                <li>Learn from experienced sellers and buyers</li>
                <li>Connect with potential business partners</li>
              </ul>
            </section>

            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Join the Community</CardTitle>
                <CardDescription>Connect with us on social media and stay updated with the latest community news.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Follow us on social media to join discussions, get updates, and connect with other community members.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline">Follow on Twitter</Button>
                  <Button variant="outline">Join on LinkedIn</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

