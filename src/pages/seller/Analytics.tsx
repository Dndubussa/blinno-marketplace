import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Package, Users } from "lucide-react";
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Category colors for charts
const categoryColors: Record<string, string> = {
  "Clothes": "hsl(168 76% 42%)",
  "Electronics": "hsl(262 83% 58%)",
  "Home Appliances": "hsl(12 76% 61%)",
  "Kitchenware": "hsl(12 76% 61%)",
  "Books": "hsl(45 93% 47%)",
  "Music": "hsl(280 76% 50%)",
  "Perfumes": "hsl(320 76% 50%)",
  "Art & Crafts": "hsl(200 76% 50%)",
  "Courses": "hsl(150 76% 50%)",
  "Other": "hsl(200 76% 50%)",
};

export default function Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    avgOrderValue: 0,
  });
  const [salesData, setSalesData] = useState<Array<{ month: string; sales: number; orders: number }>>([]);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [topProducts, setTopProducts] = useState<Array<{ name: string; sales: number; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [previousStats, setPreviousStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    avgOrderValue: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async (): Promise<void> => {
      setLoading(true);
      
      // Calculate date ranges
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id);

      // Fetch all order items with order dates
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
          price_at_purchase,
          quantity,
          created_at,
          products!inner(id, title, category),
          orders!inner(created_at)
        `)
        .eq("seller_id", user.id)
        .gte("orders.created_at", sixMonthsAgo.toISOString());

      if (!orderItems) {
        setLoading(false);
        return;
      }

      // Calculate total revenue and orders
      const totalRevenue =
        orderItems.reduce(
          (sum, item) => sum + item.price_at_purchase * item.quantity,
          0
        ) || 0;

      const totalOrders = orderItems.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate previous month stats for trends
      const previousMonthItems = orderItems.filter(item => {
        const orderDate = new Date(item.orders?.created_at || item.created_at);
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
        totalRevenue: previousMonthRevenue,
        totalOrders: previousMonthOrders,
        totalProducts: previousProductsCount || 0,
        avgOrderValue: previousMonthAvgOrder,
      });

      setStats({
        totalRevenue,
        totalOrders,
        totalProducts: productsCount || 0,
        avgOrderValue,
      });

      // Generate monthly sales data
      const monthlyData: Record<string, { sales: number; orders: number }> = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthNames[date.getMonth()]}`;
        monthlyData[monthKey] = { sales: 0, orders: 0 };
      }

      orderItems.forEach(item => {
        const orderDate = new Date(item.orders?.created_at || item.created_at);
        const monthKey = monthNames[orderDate.getMonth()];
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].sales += item.price_at_purchase * item.quantity;
          monthlyData[monthKey].orders += 1;
        }
      });

      setSalesData(Object.entries(monthlyData).map(([month, data]) => ({
        month,
        sales: Math.round(data.sales * 100) / 100,
        orders: data.orders,
      })));

      // Generate category distribution
      const categoryRevenue: Record<string, number> = {};
      orderItems.forEach(item => {
        const category = item.products?.category || "Other";
        const revenue = item.price_at_purchase * item.quantity;
        categoryRevenue[category] = (categoryRevenue[category] || 0) + revenue;
      });

      const totalCategoryRevenue = Object.values(categoryRevenue).reduce((sum, val) => sum + val, 0);
      const categoryDataArray = Object.entries(categoryRevenue)
        .map(([name, revenue]) => ({
          name,
          value: totalCategoryRevenue > 0 ? Math.round((revenue / totalCategoryRevenue) * 100) : 0,
          color: categoryColors[name] || categoryColors["Other"],
        }))
        .sort((a, b) => b.value - a.value);

      setCategoryData(categoryDataArray);

      // Generate top products
      const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
      orderItems.forEach(item => {
        const productId = item.products?.id || "";
        const productName = item.products?.title || "Unknown Product";
        const quantity = item.quantity;
        const revenue = item.price_at_purchase * item.quantity;

        if (!productSales[productId]) {
          productSales[productId] = { name: productName, sales: 0, revenue: 0 };
        }
        productSales[productId].sales += quantity;
        productSales[productId].revenue += revenue;
      });

      const topProductsArray = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          sales: p.sales,
          revenue: Math.round(p.revenue * 100) / 100,
        }));

      setTopProducts(topProductsArray);
      setLoading(false);
    };

    fetchStats();

    // Set up real-time subscription for analytics updates
    // Use a ref to track if we're already fetching to prevent loops
    let isFetching = false;
    
    const channel = supabase
      .channel("analytics-changes")
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
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your sales performance and insights.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            title: "Total Revenue",
            value: `$${stats.totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            change: previousStats.totalRevenue > 0
              ? `${((stats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue * 100).toFixed(1)}%`
              : "0%",
            changeUp: stats.totalRevenue >= previousStats.totalRevenue,
          },
          {
            title: "Total Orders",
            value: stats.totalOrders.toString(),
            icon: TrendingUp,
            change: previousStats.totalOrders > 0
              ? `${((stats.totalOrders - previousStats.totalOrders) / previousStats.totalOrders * 100).toFixed(1)}%`
              : "0%",
            changeUp: stats.totalOrders >= previousStats.totalOrders,
          },
          {
            title: "Products Listed",
            value: stats.totalProducts.toString(),
            icon: Package,
            change: previousStats.totalProducts > 0
              ? `${stats.totalProducts - previousStats.totalProducts > 0 ? '+' : ''}${stats.totalProducts - previousStats.totalProducts}`
              : "0",
            changeUp: stats.totalProducts >= previousStats.totalProducts,
          },
          {
            title: "Avg. Order Value",
            value: `$${stats.avgOrderValue.toFixed(2)}`,
            icon: Users,
            change: previousStats.avgOrderValue > 0
              ? `${((stats.avgOrderValue - previousStats.avgOrderValue) / previousStats.avgOrderValue * 100).toFixed(1)}%`
              : "0%",
            changeUp: stats.avgOrderValue >= previousStats.avgOrderValue,
          },
        ].map((stat, index) => (
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
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? <div className="h-8 w-24 animate-pulse bg-muted rounded" /> : stat.value}</div>
                {loading ? (
                  <div className="h-4 w-32 mt-1 animate-pulse bg-muted rounded" />
                ) : (
                  <p className={`text-xs ${stat.changeUp ? "text-green-500" : "text-red-500"}`}>
                    {stat.changeUp ? "+" : ""}{stat.change} from last month
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-muted-foreground">Loading chart data...</div>
                  </div>
                ) : salesData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-muted-foreground">No sales data available</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(168 76% 42%)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(168 76% 42%)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
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
                      dataKey="sales"
                      stroke="hsl(168 76% 42%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders by Month */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Orders by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-muted-foreground">Loading chart data...</div>
                  </div>
                ) : salesData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-muted-foreground">No orders data available</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="orders"
                      fill="hsl(262 83% 58%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                {loading ? (
                  <div className="text-muted-foreground">Loading chart data...</div>
                ) : categoryData.length === 0 ? (
                  <div className="text-muted-foreground">No category data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {categoryData.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No product sales data available
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${product.revenue.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.sales} {product.sales === 1 ? 'sale' : 'sales'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
