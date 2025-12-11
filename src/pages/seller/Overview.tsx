import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// Mock data for the chart (will be replaced with real data)
const revenueData = [
  { name: "Jan", revenue: 400 },
  { name: "Feb", revenue: 300 },
  { name: "Mar", revenue: 600 },
  { name: "Apr", revenue: 800 },
  { name: "May", revenue: 700 },
  { name: "Jun", revenue: 900 },
  { name: "Jul", revenue: 1100 },
];

const statCards = [
  {
    title: "Total Products",
    icon: Package,
    key: "totalProducts" as keyof Stats,
    format: (val: number) => val.toString(),
    trend: "+12%",
    trendUp: true,
  },
  {
    title: "Total Orders",
    icon: ShoppingCart,
    key: "totalOrders" as keyof Stats,
    format: (val: number) => val.toString(),
    trend: "+8%",
    trendUp: true,
  },
  {
    title: "Total Revenue",
    icon: DollarSign,
    key: "totalRevenue" as keyof Stats,
    format: (val: number) => `$${val.toFixed(2)}`,
    trend: "+23%",
    trendUp: true,
  },
  {
    title: "Avg. Order Value",
    icon: TrendingUp,
    key: "averageOrderValue" as keyof Stats,
    format: (val: number) => `$${val.toFixed(2)}`,
    trend: "-2%",
    trendUp: false,
  },
];

export default function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id);

      // Fetch order items for this seller
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("price_at_purchase, quantity")
        .eq("seller_id", user.id);

      const totalRevenue =
        orderItems?.reduce(
          (sum, item) => sum + item.price_at_purchase * item.quantity,
          0
        ) || 0;

      const totalOrders = orderItems?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders,
        totalRevenue,
        averageOrderValue,
      });
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-card transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="h-8 w-20 animate-pulse bg-muted rounded" />
                  ) : (
                    stat.format(stats[stat.key])
                  )}
                </div>
                <div className="flex items-center text-xs mt-1">
                  {stat.trendUp ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={stat.trendUp ? "text-green-500" : "text-red-500"}>
                    {stat.trend}
                  </span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(168 76% 42%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(168 76% 42%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(168 76% 42%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
