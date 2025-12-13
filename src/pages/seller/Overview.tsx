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

const statCards = [
  {
    title: "Total Products",
    icon: Package,
    key: "totalProducts" as keyof Stats,
    format: (val: number) => val.toString(),
  },
  {
    title: "Total Orders",
    icon: ShoppingCart,
    key: "totalOrders" as keyof Stats,
    format: (val: number) => val.toString(),
  },
  {
    title: "Total Revenue",
    icon: DollarSign,
    key: "totalRevenue" as keyof Stats,
    format: (val: number) => `$${val.toFixed(2)}`,
  },
  {
    title: "Avg. Order Value",
    icon: TrendingUp,
    key: "averageOrderValue" as keyof Stats,
    format: (val: number) => `$${val.toFixed(2)}`,
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
  const [revenueData, setRevenueData] = useState<Array<{ name: string; revenue: number }>>([]);
  const [previousStats, setPreviousStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);
      
      // Calculate date ranges
      const now = new Date();
      const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id);

      // Fetch order items with order dates
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
          price_at_purchase,
          quantity,
          orders!inner(created_at)
        `)
        .eq("seller_id", user.id)
        .gte("orders.created_at", sevenMonthsAgo.toISOString());

      if (!orderItems) {
        setLoading(false);
        return;
      }

      const totalRevenue =
        orderItems.reduce(
          (sum, item) => sum + item.price_at_purchase * item.quantity,
          0
        ) || 0;

      const totalOrders = orderItems.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate previous month stats for trends
      const previousMonthItems = orderItems.filter(item => {
        const orderDate = new Date(item.orders?.created_at || new Date());
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
      });

      const previousMonthRevenue = previousMonthItems.reduce(
        (sum, item) => sum + item.price_at_purchase * item.quantity,
        0
      );
      const previousMonthOrders = previousMonthItems.length;
      const previousMonthAvgOrder = previousMonthOrders > 0 ? previousMonthRevenue / previousMonthOrders : 0;

      // Get previous month products count
      const { count: previousProductsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .lte("created_at", lastMonthEnd.toISOString());

      setPreviousStats({
        totalProducts: previousProductsCount || 0,
        totalOrders: previousMonthOrders,
        totalRevenue: previousMonthRevenue,
        averageOrderValue: previousMonthAvgOrder,
      });

      setStats({
        totalProducts: productsCount || 0,
        totalOrders,
        totalRevenue,
        averageOrderValue,
      });

      // Generate monthly revenue data
      const monthlyRevenue: Record<string, number> = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthNames[date.getMonth()]}`;
        monthlyRevenue[monthKey] = 0;
      }

      orderItems.forEach(item => {
        const orderDate = new Date(item.orders?.created_at || new Date());
        const monthKey = monthNames[orderDate.getMonth()];
        if (monthlyRevenue[monthKey] !== undefined) {
          monthlyRevenue[monthKey] += item.price_at_purchase * item.quantity;
        }
      });

      setRevenueData(Object.entries(monthlyRevenue).map(([name, revenue]) => ({
        name,
        revenue: Math.round(revenue * 100) / 100,
      })));

      setLoading(false);
    };

    fetchStats();

    // Set up real-time subscription for overview updates
    const channel = supabase
      .channel("overview-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
          filter: `seller_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Overview update detected:", payload);
          fetchStats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `seller_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Product change detected for overview:", payload);
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
                {loading ? (
                  <div className="h-4 w-32 mt-1 animate-pulse bg-muted rounded" />
                ) : (() => {
                  const currentValue = stats[stat.key];
                  const previousValue = previousStats[stat.key];
                  let trend = "0%";
                  let trendUp = true;
                  
                  if (previousValue > 0) {
                    const change = ((currentValue - previousValue) / previousValue) * 100;
                    trend = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
                    trendUp = change >= 0;
                  } else if (currentValue > 0) {
                    trend = "+100%";
                    trendUp = true;
                  }
                  
                  return (
                    <div className="flex items-center text-xs mt-1">
                      {trendUp ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={trendUp ? "text-green-500" : "text-red-500"}>
                        {trend}
                      </span>
                      <span className="text-muted-foreground ml-1">from last month</span>
                    </div>
                  );
                })()}
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
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-muted-foreground">Loading chart data...</div>
                </div>
              ) : revenueData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-muted-foreground">No revenue data available</div>
                </div>
              ) : (
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
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
