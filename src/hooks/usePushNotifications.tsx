import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    setUnreadCount(count || 0);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread count
    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('push-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Get sender info
          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newMessage.sender_id)
            .single();

          // Show browser notification if permitted
          if (permission === "granted" && document.hidden) {
            showNotification(
              `New message from ${sender?.full_name || "Someone"}`,
              newMessage.content.substring(0, 100)
            );
          }

          // Update unread count
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, fetchUnreadCount]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive notifications for new messages",
        });
        return true;
      } else if (result === "denied") {
        toast({
          title: "Notifications Blocked",
          description: "You can enable them in your browser settings",
          variant: "destructive",
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported, toast]);

  const showNotification = useCallback((title: string, body: string) => {
    if (permission !== "granted") return;

    try {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: "blinno-message",
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }, [permission]);

  return {
    isSupported,
    permission,
    unreadCount,
    requestPermission,
    showNotification,
    refetchUnread: fetchUnreadCount,
  };
}
