import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Music,
  BookOpen,
  GraduationCap,
  FileText,
  Link as LinkIcon,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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
  digitalProducts: number;
  physicalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
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
    digitalProducts: 0,
    physicalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
  });
  const [revenueData, setRevenueData] = useState<Array<{ name: string; revenue: number }>>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{ category: string; count: number }>>([]);
  const [recentProducts, setRecentProducts] = useState<Array<{ id: string; title: string; category: string; is_active: boolean; stock_quantity: number | null }>>([]);
  const [previousStats, setPreviousStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    digitalProducts: 0,
    physicalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);
      
      // Calculate date ranges
      const now = new Date();
      const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch products with details
      const { data: products, count: productsCount } = await supabase
        .from("products")
        .select("id, title, category, is_active, stock_quantity, created_at", { count: "exact" })
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

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

      // Calculate product type breakdown
      const digitalCategories = ["Music", "Books", "Courses"];
      const digitalProducts = products?.filter(p => digitalCategories.includes(p.category)).length || 0;
      const physicalProducts = (productsCount || 0) - digitalProducts;
      const activeProducts = products?.filter(p => p.is_active).length || 0;
      const inactiveProducts = (productsCount || 0) - activeProducts;

      // Calculate category breakdown
      const categoryCounts: Record<string, number> = {};
      products?.forEach(product => {
        categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
      });
      const categoryBreakdownArray = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get recent products (last 5)
      const recentProductsArray = (products || [])
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          title: p.title,
          category: p.category,
          is_active: p.is_active,
          stock_quantity: p.stock_quantity,
        }));

      setCategoryBreakdown(categoryBreakdownArray);
      setRecentProducts(recentProductsArray);

      setPreviousStats({
        totalProducts: previousProductsCount || 0,
        totalOrders: previousMonthOrders,
        totalRevenue: previousMonthRevenue,
        averageOrderValue: previousMonthAvgOrder,
        digitalProducts: 0, // Previous month breakdown not needed
        physicalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
      });

      setStats({
        totalProducts: productsCount || 0,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        digitalProducts,
        physicalProducts,
        activeProducts,
        inactiveProducts,
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
    // Use a ref to track if we're already fetching to prevent loops
    let isFetching = false;
    
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
        () => {
          if (!isFetching) {
            isFetching = true;
            fetchStats().finally(() => {
              isFetching = false;
            });
          }
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
        () => {
          if (!isFetching) {
            isFetching = true;
            fetchStats().finally(() => {
              isFetching = false;
            });
          }
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

      {/* Additional Stats - Product Types */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Digital Products
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-20 animate-pulse bg-muted rounded" />
                ) : (
                  stats.digitalProducts
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Music, Books, Courses
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Physical Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-20 animate-pulse bg-muted rounded" />
                ) : (
                  stats.physicalProducts
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires shipping
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Products
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-20 animate-pulse bg-muted rounded" />
                ) : (
                  stats.activeProducts
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Visible to buyers
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-20 animate-pulse bg-muted rounded" />
                ) : (
                  stats.inactiveProducts
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Hidden from marketplace
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions & Recent Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/seller/products")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Product
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/seller/orders")}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                View Orders
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/seller/analytics")}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              ) : categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products yet</p>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.map((item, index) => {
                    const getCategoryIcon = (cat: string) => {
                      if (cat === "Music") return <Music className="h-4 w-4" />;
                      if (cat === "Books") return <BookOpen className="h-4 w-4" />;
                      if (cat === "Courses") return <GraduationCap className="h-4 w-4" />;
                      return <Package className="h-4 w-4" />;
                    };
                    return (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <span className="text-sm font-medium">{item.category}</span>
                        </div>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Products</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/seller/products")}
            >
              View All
              <LinkIcon className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-muted rounded" />
                ))}
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No products yet</p>
                <Button onClick={() => navigate("/seller/products")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProducts.map((product) => {
                  const isDigital = ["Music", "Books", "Courses"].includes(product.category);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/seller/products")}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{product.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          {isDigital && (
                            <Badge variant="secondary" className="text-xs">
                              Digital
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {product.is_active ? (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                          {!isDigital && product.stock_quantity !== null && (
                            <span className="text-xs text-muted-foreground">
                              {product.stock_quantity} in stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
