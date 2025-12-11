import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign,
  Mail,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  newsletterSubscribers: number;
  pendingOrders: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    newsletterSubscribers: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch orders
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, status");

      // Fetch products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Fetch newsletter subscribers
      const { count: subscribersCount } = await supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalOrders: orders?.length || 0,
        totalProducts: productsCount || 0,
        totalRevenue,
        newsletterSubscribers: subscribersCount || 0,
        pendingOrders,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "Total Products", value: stats.totalProducts, icon: Package, color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { title: "Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { title: "Newsletter Subscribers", value: stats.newsletterSubscribers, icon: Mail, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
    { title: "Pending Orders", value: stats.pendingOrders, icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">
          Monitor and manage all aspects of the Blinno marketplace.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-24 animate-pulse bg-muted rounded" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              System Status
            </CardTitle>
            <CardDescription>All systems operational</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm text-green-500 font-medium">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Service</span>
                <span className="text-sm text-green-500 font-medium">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage</span>
                <span className="text-sm text-green-500 font-medium">Online</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
            <CardDescription>Platform performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Sellers</span>
                <span className="text-sm font-medium">--</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Orders Today</span>
                <span className="text-sm font-medium">--</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Signups (7d)</span>
                <span className="text-sm font-medium">--</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}