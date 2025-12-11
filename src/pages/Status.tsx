import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Status() {
  const navigate = useNavigate();

  const services = [
    {
      name: "Marketplace",
      status: "operational",
      description: "Product browsing, search, and listings",
    },
    {
      name: "Payments",
      status: "operational",
      description: "ClickPesa payment processing",
    },
    {
      name: "Authentication",
      status: "operational",
      description: "User login and registration",
    },
    {
      name: "Messaging",
      status: "operational",
      description: "Buyer-seller communication",
    },
    {
      name: "API",
      status: "operational",
      description: "REST API endpoints",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-500">Operational</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      case "down":
        return <Badge className="bg-red-500">Down</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

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

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">System Status</h1>
            <p className="text-muted-foreground">Real-time status of Blinno services</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <CardTitle>All Systems Operational</CardTitle>
              </div>
              <CardDescription>All services are running normally</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Service Status</h2>
            {services.map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-muted">
            <CardHeader>
              <CardTitle>Incident History</CardTitle>
              <CardDescription>Past incidents and maintenance windows</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No recent incidents. All services have been operating normally.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Subscribe to Updates</CardTitle>
              <CardDescription>Get notified when services experience issues</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">Subscribe to Status Updates</Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

