import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Package, Tag, Heart } from "lucide-react";

// Mock notifications for now
const notifications = [
  {
    id: "1",
    type: "order",
    title: "Order Shipped",
    message: "Your order #12345678 has been shipped and is on its way!",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "promo",
    title: "Flash Sale!",
    message: "Don't miss out! 50% off on electronics this weekend.",
    time: "1 day ago",
    read: true,
  },
  {
    id: "3",
    type: "wishlist",
    title: "Price Drop Alert",
    message: "An item in your wishlist is now 20% off!",
    time: "2 days ago",
    read: true,
  },
];

export default function BuyerNotifications() {
  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package className="w-5 h-5" />;
      case "promo":
        return <Tag className="w-5 h-5" />;
      case "wishlist":
        return <Heart className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-100 text-blue-600";
      case "promo":
        return "bg-green-100 text-green-600";
      case "wishlist":
        return "bg-pink-100 text-pink-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your orders and deals</p>
        </div>
        <Badge variant="secondary">
          {notifications.filter((n) => !n.read).length} unread
        </Badge>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`${
              !notification.read ? "border-primary/30 bg-primary/5" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg ${getIconColor(notification.type)}`}
                >
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.time}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No notifications
            </h3>
            <p className="text-muted-foreground">
              You&apos;re all caught up!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
