import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Search,
  Eye,
  AlertTriangle,
  Users,
  Clock,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  last_message_at: string;
  buyer_profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  seller_profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  message_count?: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

export default function AdminModeration() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isViewingMessages, setIsViewingMessages] = useState(false);

  // Fetch all conversations with participant info
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ["admin-conversations"],
    queryFn: async () => {
      // Fetch conversations
      const { data: convos, error: convosError } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (convosError) throw convosError;

      // Fetch profiles for all participants
      const buyerIds = [...new Set(convos?.map((c) => c.buyer_id) || [])];
      const sellerIds = [...new Set(convos?.map((c) => c.seller_id) || [])];
      const allIds = [...new Set([...buyerIds, ...sellerIds])];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", allIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      // Fetch message counts for each conversation
      const conversationsWithDetails = await Promise.all(
        (convos || []).map(async (convo) => {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", convo.id);

          return {
            ...convo,
            buyer_profile: profileMap.get(convo.buyer_id),
            seller_profile: profileMap.get(convo.seller_id),
            message_count: count || 0,
          };
        })
      );

      return conversationsWithDetails as Conversation[];
    },
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["admin-messages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation?.id && isViewingMessages,
  });

  const filteredConversations = conversations?.filter((convo) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      convo.buyer_profile?.full_name?.toLowerCase().includes(search) ||
      convo.buyer_profile?.email?.toLowerCase().includes(search) ||
      convo.seller_profile?.full_name?.toLowerCase().includes(search) ||
      convo.seller_profile?.email?.toLowerCase().includes(search)
    );
  });

  const totalConversations = conversations?.length || 0;
  const activeToday = conversations?.filter(
    (c) => new Date(c.last_message_at).toDateString() === new Date().toDateString()
  ).length || 0;

  const handleViewConversation = (convo: Conversation) => {
    setSelectedConversation(convo);
    setIsViewingMessages(true);
  };

  const getParticipantName = (senderId: string) => {
    if (!selectedConversation) return "Unknown";
    if (senderId === selectedConversation.buyer_id) {
      return selectedConversation.buyer_profile?.full_name || "Buyer";
    }
    return selectedConversation.seller_profile?.full_name || "Seller";
  };

  const getParticipantRole = (senderId: string) => {
    if (!selectedConversation) return "unknown";
    return senderId === selectedConversation.buyer_id ? "buyer" : "seller";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Conversation Moderation</h1>
        <p className="text-muted-foreground">
          Review and manage buyer-seller conversations for dispute resolution
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conversations
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Today
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Participants
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set([
                ...(conversations?.map((c) => c.buyer_id) || []),
                ...(conversations?.map((c) => c.seller_id) || []),
              ]).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by participant name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            All Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingConversations ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations && filteredConversations.length > 0 ? (
            <div className="space-y-3">
              {filteredConversations.map((convo) => (
                <div
                  key={convo.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={convo.buyer_profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                          {convo.buyer_profile?.full_name?.[0] || "B"}
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={convo.seller_profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-green-100 text-green-600">
                          {convo.seller_profile?.full_name?.[0] || "S"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {convo.buyer_profile?.full_name || "Unknown Buyer"}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {convo.seller_profile?.full_name || "Unknown Seller"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{convo.message_count} messages</span>
                        <span>•</span>
                        <span>Last active {format(new Date(convo.last_message_at), "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewConversation(convo)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No conversations found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search" : "No buyer-seller conversations yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Viewer Dialog */}
      <Dialog open={isViewingMessages} onOpenChange={setIsViewingMessages}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation Details
            </DialogTitle>
          </DialogHeader>

          {selectedConversation && (
            <div className="space-y-4">
              {/* Participants Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.buyer_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {selectedConversation.buyer_profile?.full_name?.[0] || "B"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedConversation.buyer_profile?.full_name || "Unknown"}</p>
                    <Badge variant="secondary" className="text-xs">Buyer</Badge>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium">{selectedConversation.seller_profile?.full_name || "Unknown"}</p>
                    <Badge variant="outline" className="text-xs">Seller</Badge>
                  </div>
                  <Avatar>
                    <AvatarImage src={selectedConversation.seller_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {selectedConversation.seller_profile?.full_name?.[0] || "S"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {loadingMessages ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-3/4" />
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          getParticipantRole(msg.sender_id) === "buyer" ? "items-start" : "items-end"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getParticipantName(msg.sender_id)}
                          </span>
                          <Badge
                            variant={getParticipantRole(msg.sender_id) === "buyer" ? "secondary" : "outline"}
                            className="text-[10px] py-0"
                          >
                            {getParticipantRole(msg.sender_id)}
                          </Badge>
                        </div>
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            getParticipantRole(msg.sender_id) === "buyer"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-green-100 text-green-900"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(msg.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages in this conversation
                  </div>
                )}
              </ScrollArea>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800">
                  This is a read-only view for moderation purposes. Messages cannot be edited or deleted.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
