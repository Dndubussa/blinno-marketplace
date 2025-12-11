import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Package, Eye } from "lucide-react";
import { format } from "date-fns";

export default function BuyerOrders() {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["buyer-all-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(*))")
        .eq("buyer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground">Track and manage your orders</p>
      </div>

      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.order_items?.length || 0} item(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        ${Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/order/${order.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Track Order
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="mt-4 pt-4 border-t flex gap-2 overflow-x-auto">
                    {order.order_items.slice(0, 4).map((item: any) => (
                      <div
                        key={item.id}
                        className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden"
                      >
                        {item.products?.images?.[0] ? (
                          <img
                            src={item.products.images[0]}
                            alt={item.products.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            N/A
                          </div>
                        )}
                      </div>
                    ))}
                    {order.order_items.length > 4 && (
                      <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground text-sm">
                        +{order.order_items.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No orders yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start shopping to see your orders here
            </p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
