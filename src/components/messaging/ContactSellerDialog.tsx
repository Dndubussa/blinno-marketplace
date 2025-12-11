import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

interface ContactSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

export function ContactSellerDialog({
  open,
  onOpenChange,
  sellerId,
  sellerName,
  sellerAvatar,
}: ContactSellerDialogProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get or create conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ["conversation", user?.id, sellerId],
    queryFn: async () => {
      if (!user) return null;

      // Try to find existing conversation
      const { data: existing, error: findError } = await supabase
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .or(`buyer_id.eq.${sellerId},seller_id.eq.${sellerId}`)
        .maybeSingle();

      if (findError) throw findError;
      
      // Filter to find exact match
      if (existing) {
        const isMatch = (existing.buyer_id === user.id && existing.seller_id === sellerId) ||
                       (existing.buyer_id === sellerId && existing.seller_id === user.id);
        if (isMatch) return existing;
      }

      return null;
    },
    enabled: !!user && open,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: async () => {
      if (!conversation) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Not authenticated");

      let conversationId = conversation?.id;

      // Create conversation if it doesn't exist
      if (!conversationId) {
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            buyer_id: user.id,
            seller_id: sellerId,
          })
          .select()
          .single();

        if (createError) throw createError;
        conversationId = newConversation.id;
      }

      // Send message
      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: sellerId,
        content,
      });

      if (messageError) throw messageError;

      // Update last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      return conversationId;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    },
  });

  // Subscribe to new messages
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Please sign in to contact this seller.
          </p>
          <Button asChild>
            <a href="/sign-in">Sign In</a>
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={sellerAvatar || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(sellerName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-left">{sellerName}</DialogTitle>
              <p className="text-sm text-muted-foreground">Seller</p>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {conversationLoading || messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-muted-foreground">
                Start a conversation with {sellerName}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === user.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
