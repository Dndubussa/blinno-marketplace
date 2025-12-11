import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  Package,
  Heart,
  Clock,
  TrendingUp,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

export default function BuyerOverview() {
  const { user, profile } = useAuth();

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["buyer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(*))")
        .eq("buyer_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["buyer-stats", user?.id],
    queryFn: async () => {
      const { data: allOrders, error } = await supabase
        .from("orders")
        .select("id, status, total_amount")
        .eq("buyer_id", user?.id);

      if (error) throw error;

      const totalOrders = allOrders?.length || 0;
      const pendingOrders = allOrders?.filter((o) => o.status === "pending").length || 0;
      const totalSpent = allOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      return { totalOrders, pendingOrders, totalSpent };
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

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your orders
          </p>
        </div>
        <Button asChild>
          <Link to="/products">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.totalOrders || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.pendingOrders || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">
                  ${stats?.totalSpent?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/buyer/orders">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.order_items?.length || 0} items · $
                        {Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/order/${order.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
              <Button className="mt-4" asChild>
                <Link to="/products">Start Shopping</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/wishlist">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-pink-100">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Your Wishlist</h3>
                <p className="text-sm text-muted-foreground">
                  View saved items you love
                </p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/products">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Browse Products</h3>
                <p className="text-sm text-muted-foreground">
                  Discover new items
                </p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
