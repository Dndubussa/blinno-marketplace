import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ShoppingBag, Truck } from "lucide-react";
import { format } from "date-fns";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    shipped: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    delivered: "bg-green-500/10 text-green-500 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return colors[status] || "bg-muted text-muted-foreground";
};

export function PurchaseHistory() {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from("order_items")
            .select(`
              *,
              products:product_id (id, title, images)
            `)
            .eq("order_id", order.id);

          return { ...order, items: items || [] };
        })
      );

      return ordersWithItems;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No purchases yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When you make a purchase, it will appear here
          </p>
          <Link
            to="/products"
            className="mt-4 text-primary hover:underline"
          >
            Browse products
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            View all your past orders and their status
          </CardDescription>
        </CardHeader>
      </Card>

      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-6">
            {/* Order Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  Order placed on {format(new Date(order.created_at), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Order ID: {order.id.slice(0, 8)}...
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                <span className="font-semibold">
                  {formatPrice(order.total_amount)}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/order/${order.id}`}>
                    <Truck className="mr-1 h-4 w-4" />
                    Track
                  </Link>
                </Button>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-4 divide-y divide-border">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.products?.images?.[0] ? (
                      <img
                        src={item.products.images[0]}
                        alt={item.products?.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product_id}`}
                      className="font-medium hover:text-primary line-clamp-1"
                    >
                      {item.products?.title || "Product unavailable"}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {formatPrice(item.price_at_purchase)}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(item.quantity * item.price_at_purchase)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
