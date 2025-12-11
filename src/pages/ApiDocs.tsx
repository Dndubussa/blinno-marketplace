import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Code, Book, Key, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ApiDocs() {
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

          <h1 className="text-4xl font-bold mb-2 text-foreground">API Documentation</h1>
          <p className="text-muted-foreground mb-8">Integrate Blinno into your applications with our REST API</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Getting Started</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Blinno API allows developers to integrate Blinno marketplace functionality into their applications. Our API provides access to products, orders, user data, and more.
              </p>
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium mb-1">API Access</p>
                      <p className="text-sm text-muted-foreground">
                        API access is currently available for Enterprise plan sellers. Contact us at support@blinno.app to request API access.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Authentication</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All API requests require authentication using API keys. Include your API key in the Authorization header:
              </p>
              <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                <code className="text-foreground">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">API Endpoints</h2>
              <Tabs defaultValue="products" className="mt-4">
                <TabsList>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>
                <TabsContent value="products" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">GET /api/v1/products</CardTitle>
                      <CardDescription>Retrieve a list of products</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p className="font-mono text-muted-foreground">GET https://api.blinno.app/v1/products</p>
                        <p className="text-muted-foreground">Query parameters: category, search, limit, offset</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="orders" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">GET /api/v1/orders</CardTitle>
                      <CardDescription>Retrieve orders (requires authentication)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p className="font-mono text-muted-foreground">GET https://api.blinno.app/v1/orders</p>
                        <p className="text-muted-foreground">Query parameters: status, limit, offset</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="users" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">GET /api/v1/users/me</CardTitle>
                      <CardDescription>Get current user information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p className="font-mono text-muted-foreground">GET https://api.blinno.app/v1/users/me</p>
                        <p className="text-muted-foreground">Requires authentication</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Rate Limits</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                API requests are rate-limited to ensure fair usage:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>100 requests per minute for authenticated requests</li>
                <li>20 requests per minute for unauthenticated requests</li>
                <li>Rate limit headers are included in all responses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">SDKs and Libraries</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We're working on official SDKs for popular programming languages. Currently, you can use any HTTP client to interact with our REST API.
              </p>
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Code className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium mb-1">Coming Soon</p>
                      <p className="text-sm text-muted-foreground">
                        Official SDKs for JavaScript, Python, and PHP are in development.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Support</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Need help with the API? Our developer support team is here to help.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-foreground font-medium mb-2">API Support</p>
                <p className="text-muted-foreground">Email: support@blinno.app</p>
                <p className="text-muted-foreground text-sm mt-2">For API access requests, documentation questions, or technical support.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

