import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { 
  Send, 
  Users, 
  Mail, 
  FileText, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { sendNewsletterCampaign } from "@/lib/notifications";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  is_active: boolean;
}

const newsletterTemplates = [
  {
    name: "Product Announcement",
    subject: "🚀 Exciting New Products Just Landed!",
    content: `
      <h2 style="color: #111827; margin-bottom: 16px;">New Arrivals You'll Love</h2>
      <p style="margin-bottom: 20px;">We're thrilled to announce our latest collection of amazing products from talented sellers around the world.</p>
      <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="color: white; font-size: 18px; font-weight: bold; margin: 0;">Shop the new collection today!</p>
      </div>
      <p style="color: #6b7280;">Don't miss out on these exclusive items.</p>
    `,
  },
  {
    name: "Sale Announcement",
    subject: "🔥 FLASH SALE: Up to 50% Off!",
    content: `
      <h2 style="color: #111827; margin-bottom: 16px;">Limited Time Offer</h2>
      <p style="margin-bottom: 20px;">Our biggest sale of the season is here! Get incredible discounts on thousands of items.</p>
      <div style="background-color: #fef2f2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="color: #dc2626; font-size: 32px; font-weight: bold; margin: 0;">UP TO 50% OFF</p>
        <p style="color: #7f1d1d; margin: 8px 0 0 0;">Hurry, sale ends soon!</p>
      </div>
      <p style="color: #6b7280;">Use code <strong>SALE50</strong> at checkout.</p>
    `,
  },
  {
    name: "Weekly Digest",
    subject: "📬 Your Weekly Blinno Digest",
    content: `
      <h2 style="color: #111827; margin-bottom: 16px;">This Week on Blinno</h2>
      <p style="margin-bottom: 20px;">Here's what's been happening in the Blinno marketplace this week:</p>
      <ul style="padding-left: 20px; margin-bottom: 20px;">
        <li style="margin-bottom: 12px;"><strong>🛍️ Trending Products:</strong> Check out what's popular</li>
        <li style="margin-bottom: 12px;"><strong>⭐ Featured Sellers:</strong> Discover new favorites</li>
        <li style="margin-bottom: 12px;"><strong>💡 Tips & Tricks:</strong> Get the most from Blinno</li>
      </ul>
      <p style="color: #6b7280;">See you next week!</p>
    `,
  },
];

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to load subscribers");
    } else {
      setSubscribers(data || []);
    }
    setLoading(false);
  };

  const handleSendCampaign = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Please fill in subject and content");
      return;
    }

    const activeSubscribers = subscribers.filter(s => s.is_active);
    if (activeSubscribers.length === 0) {
      toast.error("No active subscribers to send to");
      return;
    }

    setSending(true);

    try {
      const result = await sendNewsletterCampaign({
        subject,
        htmlContent: content,
        previewText: previewText || undefined,
      });

      if (result.success) {
        toast.success(`Campaign sent successfully!`, {
          description: `Delivered to ${result.data.sent} subscribers`,
          icon: <CheckCircle className="h-4 w-4" />,
        });
        setSubject("");
        setContent("");
        setPreviewText("");
      } else {
        throw new Error("Failed to send campaign");
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast.error("Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  const loadTemplate = (template: typeof newsletterTemplates[0]) => {
    setSubject(template.subject);
    setContent(template.content);
    toast.success(`Template "${template.name}" loaded`);
  };

  const activeCount = subscribers.filter(s => s.is_active).length;
  const inactiveCount = subscribers.filter(s => !s.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Newsletter</h1>
        <p className="text-muted-foreground">
          Manage subscribers and send email campaigns to your audience.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscribers.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Subscribers
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{activeCount}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unsubscribed
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveCount}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose">
            <Mail className="h-4 w-4 mr-2" />
            Compose Campaign
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="subscribers">
            <Users className="h-4 w-4 mr-2" />
            Subscribers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Create Campaign</CardTitle>
              <CardDescription>
                Compose and send an email to all active subscribers ({activeCount} recipients)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preview">Preview Text (optional)</Label>
                <Input
                  id="preview"
                  placeholder="Text shown in email preview..."
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Email Content (HTML)</Label>
                <Textarea
                  id="content"
                  placeholder="Enter HTML content for your email..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-3">
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!content}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Email Preview</DialogTitle>
                      <DialogDescription>
                        Preview how your newsletter email will appear to subscribers.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="border rounded-lg p-4 bg-white">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Subject:</strong> {subject || "(No subject)"}
                      </p>
                      <hr className="my-3" />
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content || "<p>No content</p>") }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  onClick={handleSendCampaign} 
                  disabled={sending || !subject || !content || activeCount === 0}
                  className="bg-primary hover:bg-primary/90"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to {activeCount} Subscribers
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {newsletterTemplates.map((template, index) => (
              <motion.div
                key={template.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-xs truncate">
                      {template.subject}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div 
                      className="text-sm text-muted-foreground line-clamp-3 mb-4"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(template.content.replace(/<[^>]*>/g, ' ').slice(0, 100) + '...') 
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => loadTemplate(template)}
                      className="w-full"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <CardTitle>Subscriber List</CardTitle>
              <CardDescription>
                All newsletter subscribers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : subscribers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No subscribers yet. Subscribers will appear here when people sign up.
                </p>
              ) : (
                <div className="space-y-2">
                  {subscribers.map((subscriber) => (
                    <div
                      key={subscriber.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium">{subscriber.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {subscriber.name || "No name"} • Joined {new Date(subscriber.subscribed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        subscriber.is_active 
                          ? "bg-green-500/10 text-green-500" 
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {subscriber.is_active ? "Active" : "Unsubscribed"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}