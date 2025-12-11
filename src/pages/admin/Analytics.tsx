import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  Clock,
  Radio,
  Zap,
  Globe,
  MapPin,
  Package,
  Layers,
  BarChart3,
  AlertTriangle,
  Store,
  Crown,
  Percent
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, eachDayOfInterval, differenceInDays } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import GeographicMap from "@/components/admin/GeographicMap";

interface OrderData {
  total_amount: number;
  status: string;
  created_at: string;
}

interface UserData {
  created_at: string;
}

interface ReportSchedule {
  id: string;
  email: string;
  frequency: string;
  is_active: boolean;
  last_sent: string | null;
}

interface LiveEvent {
  id: string;
  type: "order" | "user";
  message: string;
  timestamp: Date;
}

interface LocationData {
  lat: number;
  lng: number;
  orders: number;
  revenue: number;
  users: number;
  city?: string;
  country?: string;
}

interface ProductPerformance {
  id: string;
  title: string;
  category: string;
  revenue: number;
  unitsSold: number;
  stock: number;
}

interface CategoryRevenue {
  name: string;
  revenue: number;
  orders: number;
}

interface InventoryTrend {
  category: string;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface SellerPerformance {
  id: string;
  name: string;
  email: string;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  avgOrderValue: number;
  commissionRate: number;
  commissionEarned: number;
}

interface SellerTrend {
  date: string;
  [sellerId: string]: string | number;
}

const COMMISSION_RATE = 0.10; // 10% platform commission

const COLORS = ["#14b8a6", "#0891b2", "#6366f1", "#ec4899", "#f59e0b", "#84cc16", "#f97316"];

// Sample geographic data - in production, this would come from your orders with shipping addresses
const SAMPLE_LOCATIONS: LocationData[] = [
  { lat: 40.7128, lng: -74.006, orders: 145, revenue: 12450.50, users: 89, city: "New York", country: "USA" },
  { lat: 51.5074, lng: -0.1278, orders: 98, revenue: 8920.75, users: 67, city: "London", country: "UK" },
  { lat: 48.8566, lng: 2.3522, orders: 76, revenue: 6540.25, users: 45, city: "Paris", country: "France" },
  { lat: 35.6762, lng: 139.6503, orders: 112, revenue: 15230.00, users: 78, city: "Tokyo", country: "Japan" },
  { lat: -33.8688, lng: 151.2093, orders: 54, revenue: 4890.50, users: 32, city: "Sydney", country: "Australia" },
  { lat: 52.52, lng: 13.405, orders: 67, revenue: 5670.25, users: 41, city: "Berlin", country: "Germany" },
  { lat: 1.3521, lng: 103.8198, orders: 89, revenue: 9870.00, users: 56, city: "Singapore", country: "Singapore" },
  { lat: 55.7558, lng: 37.6173, orders: 43, revenue: 3450.75, users: 28, city: "Moscow", country: "Russia" },
  { lat: -23.5505, lng: -46.6333, orders: 61, revenue: 4230.50, users: 38, city: "São Paulo", country: "Brazil" },
  { lat: 19.076, lng: 72.8777, orders: 78, revenue: 5120.25, users: 52, city: "Mumbai", country: "India" },
];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState("30");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [dailyOrdersData, setDailyOrdersData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [inventoryTrends, setInventoryTrends] = useState<InventoryTrend[]>([]);
  const [topSellers, setTopSellers] = useState<SellerPerformance[]>([]);
  const [sellerTrends, setSellerTrends] = useState<SellerTrend[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    revenueChange: 0,
    totalUsers: 0,
    userChange: 0,
    totalOrders: 0,
    orderChange: 0,
    avgOrderValue: 0,
  });

  // Realtime state
  const [isLive, setIsLive] = useState(true);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Scheduling state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState<"weekly" | "monthly">("weekly");
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const addLiveEvent = useCallback((type: "order" | "user", message: string) => {
    const event: LiveEvent = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date(),
    };
    setLiveEvents(prev => [event, ...prev].slice(0, 10));
    setLastUpdate(new Date());
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!isLive) return;

    const ordersChannel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          const order = payload.new as any;
          addLiveEvent('order', `New order: $${Number(order.total_amount).toFixed(2)}`);
          
          // Update stats in real-time
          setStats(prev => ({
            ...prev,
            totalRevenue: prev.totalRevenue + Number(order.total_amount),
            totalOrders: prev.totalOrders + 1,
            avgOrderValue: (prev.totalRevenue + Number(order.total_amount)) / (prev.totalOrders + 1),
          }));
          
          // Update today's data in charts
          const today = format(new Date(), "MMM d");
          setRevenueData(prev => prev.map(item => 
            item.date === today 
              ? { ...item, revenue: item.revenue + Number(order.total_amount), orders: item.orders + 1 }
              : item
          ));
          setDailyOrdersData(prev => prev.map(item => 
            item.date === today 
              ? { ...item, orders: item.orders + 1 }
              : item
          ));
          
          toast.success("New order received!", {
            description: `$${Number(order.total_amount).toFixed(2)}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order updated:', payload);
          const order = payload.new as any;
          addLiveEvent('order', `Order updated: ${order.status}`);
          
          // Update order status distribution
          setOrderStatusData(prev => {
            const oldStatus = (payload.old as any)?.status;
            const newStatus = order.status;
            
            if (oldStatus === newStatus) return prev;
            
            return prev.map(item => {
              if (item.name.toLowerCase() === oldStatus) {
                return { ...item, value: Math.max(0, item.value - 1) };
              }
              if (item.name.toLowerCase() === newStatus) {
                return { ...item, value: item.value + 1 };
              }
              return item;
            });
          });
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('New user registered:', payload);
          const profile = payload.new as any;
          addLiveEvent('user', `New user: ${profile.full_name || profile.email || 'Anonymous'}`);
          
          // Update stats
          setStats(prev => ({
            ...prev,
            totalUsers: prev.totalUsers + 1,
          }));
          
          // Update user growth chart
          const today = format(new Date(), "MMM d");
          setUserGrowthData(prev => prev.map((item, idx) => 
            item.date === today 
              ? { ...item, newUsers: item.newUsers + 1, users: item.users + 1 }
              : idx > prev.findIndex(i => i.date === today)
                ? { ...item, users: item.users + 1 }
                : item
          ));
          
          toast.success("New user registered!", {
            description: profile.full_name || profile.email || 'New user joined',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [isLive, addLiveEvent]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, dateRange, useCustomRange]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from("analytics_report_schedules")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSchedules(data as ReportSchedule[]);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    
    let startDate: Date;
    let previousStartDate: Date;
    let days: number;

    if (useCustomRange && dateRange?.from && dateRange?.to) {
      startDate = dateRange.from;
      days = differenceInDays(dateRange.to, dateRange.from) + 1;
      previousStartDate = subDays(startDate, days);
    } else {
      days = parseInt(timeRange);
      startDate = subDays(new Date(), days);
      previousStartDate = subDays(startDate, days);
    }

    try {
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, status, created_at")
        .gte("created_at", previousStartDate.toISOString())
        .order("created_at", { ascending: true });

      const { data: users } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", previousStartDate.toISOString())
        .order("created_at", { ascending: true });

      // Fetch products with order items for performance data
      const { data: products } = await supabase
        .from("products")
        .select("id, title, category, price, stock_quantity, seller_id");

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, quantity, price_at_purchase, order_id, seller_id, orders!inner(created_at)")
        .gte("orders.created_at", startDate.toISOString());

      // Fetch seller profiles
      const { data: sellerProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      const endDate = useCustomRange && dateRange?.to ? dateRange.to : new Date();
      
      if (orders && users) {
        processData(orders, users, days, startDate, previousStartDate, endDate);
      }

      if (products && orderItems) {
        processProductData(products, orderItems);
      }

      if (orderItems && sellerProfiles && products) {
        processSellerData(orderItems, sellerProfiles, products, startDate, endDate);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const processSellerData = (orderItems: any[], profiles: any[], products: any[], startDate: Date, endDate: Date) => {
    // Group order items by seller
    const sellerDataMap = new Map<string, {
      revenue: number;
      orders: Set<string>;
      products: Set<string>;
    }>();

    orderItems.forEach(item => {
      const existing = sellerDataMap.get(item.seller_id) || {
        revenue: 0,
        orders: new Set(),
        products: new Set()
      };
      existing.revenue += Number(item.price_at_purchase) * item.quantity;
      existing.orders.add(item.order_id);
      existing.products.add(item.product_id);
      sellerDataMap.set(item.seller_id, existing);
    });

    // Build seller performance list
    const sellerPerformanceList: SellerPerformance[] = Array.from(sellerDataMap.entries())
      .map(([sellerId, data]) => {
        const profile = profiles.find(p => p.id === sellerId);
        const sellerProducts = products.filter(p => p.seller_id === sellerId);
        const commissionEarned = data.revenue * COMMISSION_RATE;
        
        return {
          id: sellerId,
          name: profile?.full_name || 'Unknown Seller',
          email: profile?.email || '',
          totalRevenue: data.revenue,
          totalOrders: data.orders.size,
          totalProducts: sellerProducts.length,
          avgOrderValue: data.orders.size > 0 ? data.revenue / data.orders.size : 0,
          commissionRate: COMMISSION_RATE * 100,
          commissionEarned
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    setTopSellers(sellerPerformanceList);

    // Build seller trends over time (top 5 sellers)
    const topSellerIds = sellerPerformanceList.slice(0, 5).map(s => s.id);
    const dateRangeArray = eachDayOfInterval({ start: startDate, end: endDate });
    
    const trendsData: SellerTrend[] = dateRangeArray.map(date => {
      const dayStr = format(date, "yyyy-MM-dd");
      const trend: SellerTrend = { date: format(date, "MMM d") };
      
      topSellerIds.forEach(sellerId => {
        const dayRevenue = orderItems
          .filter(item => {
            const itemDate = format(new Date((item.orders as any).created_at), "yyyy-MM-dd");
            return item.seller_id === sellerId && itemDate === dayStr;
          })
          .reduce((sum, item) => sum + (Number(item.price_at_purchase) * item.quantity), 0);
        
        const seller = sellerPerformanceList.find(s => s.id === sellerId);
        trend[seller?.name || sellerId] = dayRevenue;
      });
      
      return trend;
    });

    setSellerTrends(trendsData);
  };

  const processProductData = (products: any[], orderItems: any[]) => {
    // Calculate product performance
    const productSalesMap = new Map<string, { revenue: number; units: number }>();
    
    orderItems.forEach(item => {
      const existing = productSalesMap.get(item.product_id) || { revenue: 0, units: 0 };
      productSalesMap.set(item.product_id, {
        revenue: existing.revenue + (Number(item.price_at_purchase) * item.quantity),
        units: existing.units + item.quantity
      });
    });

    // Top selling products
    const topProductsList: ProductPerformance[] = products
      .map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        revenue: productSalesMap.get(p.id)?.revenue || 0,
        unitsSold: productSalesMap.get(p.id)?.units || 0,
        stock: p.stock_quantity
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setTopProducts(topProductsList);

    // Revenue by category
    const categoryMap = new Map<string, { revenue: number; orders: Set<string> }>();
    
    orderItems.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        const existing = categoryMap.get(product.category) || { revenue: 0, orders: new Set() };
        existing.revenue += Number(item.price_at_purchase) * item.quantity;
        existing.orders.add(item.order_id);
        categoryMap.set(product.category, existing);
      }
    });

    const categoryRevenueData: CategoryRevenue[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        revenue: data.revenue,
        orders: data.orders.size
      }))
      .sort((a, b) => b.revenue - a.revenue);

    setCategoryRevenue(categoryRevenueData);

    // Inventory trends by category
    const inventoryMap = new Map<string, { inStock: number; lowStock: number; outOfStock: number }>();
    
    products.forEach(p => {
      const existing = inventoryMap.get(p.category) || { inStock: 0, lowStock: 0, outOfStock: 0 };
      if (p.stock_quantity === 0) {
        existing.outOfStock++;
      } else if (p.stock_quantity < 10) {
        existing.lowStock++;
      } else {
        existing.inStock++;
      }
      inventoryMap.set(p.category, existing);
    });

    const inventoryData: InventoryTrend[] = Array.from(inventoryMap.entries())
      .map(([category, data]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        ...data
      }));

    setInventoryTrends(inventoryData);
  };

  const processData = (
    orders: OrderData[],
    users: UserData[],
    days: number,
    startDate: Date,
    previousStartDate: Date,
    endDate: Date
  ) => {
    const dateRangeArray = eachDayOfInterval({ start: startDate, end: endDate });

    const currentOrders = orders.filter(o => new Date(o.created_at) >= startDate);
    const previousOrders = orders.filter(
      o => new Date(o.created_at) >= previousStartDate && new Date(o.created_at) < startDate
    );

    const currentUsers = users.filter(u => new Date(u.created_at) >= startDate);
    const previousUsers = users.filter(
      u => new Date(u.created_at) >= previousStartDate && new Date(u.created_at) < startDate
    );

    const currentRevenue = currentOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const userChange = previousUsers.length > 0
      ? ((currentUsers.length - previousUsers.length) / previousUsers.length) * 100
      : 0;

    const orderChange = previousOrders.length > 0
      ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
      : 0;

    setStats({
      totalRevenue: currentRevenue,
      revenueChange,
      totalUsers: currentUsers.length,
      userChange,
      totalOrders: currentOrders.length,
      orderChange,
      avgOrderValue: currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0,
    });

    const revenueByDay = dateRangeArray.map(date => {
      const dayStr = format(date, "yyyy-MM-dd");
      const dayOrders = currentOrders.filter(
        o => format(new Date(o.created_at), "yyyy-MM-dd") === dayStr
      );
      return {
        date: format(date, "MMM d"),
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
        orders: dayOrders.length,
      };
    });
    setRevenueData(revenueByDay);
    setDailyOrdersData(revenueByDay);

    let cumulativeUsers = 0;
    const userGrowth = dateRangeArray.map(date => {
      const dayStr = format(date, "yyyy-MM-dd");
      const newUsers = currentUsers.filter(
        u => format(new Date(u.created_at), "yyyy-MM-dd") === dayStr
      ).length;
      cumulativeUsers += newUsers;
      return {
        date: format(date, "MMM d"),
        users: cumulativeUsers,
        newUsers,
      };
    });
    setUserGrowthData(userGrowth);

    const statusCounts: Record<string, number> = {};
    currentOrders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
    setOrderStatusData(statusData);
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    prefix = "",
    suffix = ""
  }: {
    title: string;
    value: number | string;
    change: number;
    icon: any;
    prefix?: string;
    suffix?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </div>
        <div className={`flex items-center text-xs mt-1 ${
          change >= 0 ? "text-green-500" : "text-red-500"
        }`}>
          {change >= 0 ? (
            <ArrowUpRight className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDownRight className="h-3 w-3 mr-1" />
          )}
          {Math.abs(change).toFixed(1)}% from previous period
        </div>
      </CardContent>
    </Card>
  );

  const exportToCSV = () => {
    const headers = ["Date", "Revenue ($)", "Orders", "New Users", "Cumulative Users"];
    const rows = revenueData.map((item, index) => [
      item.date,
      item.revenue.toFixed(2),
      item.orders,
      userGrowthData[index]?.newUsers || 0,
      userGrowthData[index]?.users || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("CSV report downloaded successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.text("Analytics Report", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    const periodLabel = useCustomRange && dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
      : `Last ${timeRange} days`;
    doc.text(`Period: ${periodLabel}`, pageWidth / 2, 30, { align: "center" });
    doc.text(`Generated: ${format(new Date(), "MMM d, yyyy")}`, pageWidth / 2, 38, { align: "center" });

    doc.setFontSize(14);
    doc.text("Summary", 14, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [["Metric", "Value", "Change"]],
      body: [
        ["Total Revenue", `$${stats.totalRevenue.toFixed(2)}`, `${stats.revenueChange >= 0 ? "+" : ""}${stats.revenueChange.toFixed(1)}%`],
        ["New Users", stats.totalUsers.toString(), `${stats.userChange >= 0 ? "+" : ""}${stats.userChange.toFixed(1)}%`],
        ["Total Orders", stats.totalOrders.toString(), `${stats.orderChange >= 0 ? "+" : ""}${stats.orderChange.toFixed(1)}%`],
        ["Avg Order Value", `$${stats.avgOrderValue.toFixed(2)}`, "-"],
      ],
      theme: "grid",
      headStyles: { fillColor: [20, 184, 166] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(14);
    doc.text("Daily Breakdown", 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [["Date", "Revenue ($)", "Orders", "New Users"]],
      body: revenueData.map((item, index) => [
        item.date,
        item.revenue.toFixed(2),
        item.orders,
        userGrowthData[index]?.newUsers || 0,
      ]),
      theme: "grid",
      headStyles: { fillColor: [20, 184, 166] },
    });

    if (orderStatusData.length > 0) {
      const statusY = (doc as any).lastAutoTable.finalY || 150;
      if (statusY < 250) {
        doc.setFontSize(14);
        doc.text("Order Status Distribution", 14, statusY + 15);
        
        autoTable(doc, {
          startY: statusY + 20,
          head: [["Status", "Count"]],
          body: orderStatusData.map(item => [item.name, item.value]),
          theme: "grid",
          headStyles: { fillColor: [20, 184, 166] },
        });
      }
    }

    doc.save(`analytics-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF report downloaded successfully");
  };

  const handleSaveSchedule = async () => {
    if (!scheduleEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setSavingSchedule(true);
    try {
      const { error } = await supabase.functions.invoke("scheduled-analytics-report", {
        body: { email: scheduleEmail, frequency: scheduleFrequency },
      });

      if (error) throw error;

      toast.success("Report schedule saved successfully");
      setScheduleDialogOpen(false);
      setScheduleEmail("");
      fetchSchedules();
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast.error("Failed to save schedule");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleToggleSchedule = async (schedule: ReportSchedule) => {
    try {
      const { error } = await supabase.functions.invoke("scheduled-analytics-report", {
        body: { email: schedule.email, enabled: !schedule.is_active },
      });

      if (error) throw error;

      toast.success(schedule.is_active ? "Schedule disabled" : "Schedule enabled");
      fetchSchedules();
    } catch (error: any) {
      console.error("Error toggling schedule:", error);
      toast.error("Failed to update schedule");
    }
  };

  const getDateRangeLabel = () => {
    if (useCustomRange && dateRange?.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`;
      }
      return format(dateRange.from, "MMM d, yyyy");
    }
    return `Last ${timeRange} days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Analytics</h1>
            {isLive && (
              <Badge variant="outline" className="gap-1.5 bg-green-500/10 text-green-500 border-green-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Platform performance metrics and trends.
            {isLive && lastUpdate && (
              <span className="ml-2 text-xs">
                Last update: {format(lastUpdate, "HH:mm:ss")}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
            <Radio className={cn("h-4 w-4", isLive ? "text-green-500" : "text-muted-foreground")} />
            <Label htmlFor="live-toggle" className="text-sm cursor-pointer">Live Updates</Label>
            <Switch
              id="live-toggle"
              checked={isLive}
              onCheckedChange={setIsLive}
            />
          </div>

          {/* Schedule Reports Button */}
          <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Schedule Reports
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Schedule Automated Reports
                </DialogTitle>
                <DialogDescription>
                  Set up automatic analytics reports to be sent to your email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={scheduleEmail}
                    onChange={(e) => setScheduleEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={scheduleFrequency} onValueChange={(v: "weekly" | "monthly") => setScheduleFrequency(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly (Every Monday)</SelectItem>
                      <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveSchedule} disabled={savingSchedule} className="w-full">
                  {savingSchedule ? "Saving..." : "Save Schedule"}
                </Button>

                {schedules.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <Label className="text-sm font-medium">Active Schedules</Label>
                    <div className="space-y-2 mt-2">
                      {schedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{schedule.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{schedule.frequency}</p>
                          </div>
                          <Switch
                            checked={schedule.is_active}
                            onCheckedChange={() => handleToggleSchedule(schedule)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Export Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Range Selection */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("gap-2 min-w-[200px] justify-start", !useCustomRange && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4" />
                  {getDateRangeLabel()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Custom Range</Label>
                    <Switch
                      checked={useCustomRange}
                      onCheckedChange={(checked) => {
                        setUseCustomRange(checked);
                        if (!checked) setDateRange(undefined);
                      }}
                    />
                  </div>
                </div>
                {useCustomRange ? (
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    disabled={(date) => date > new Date()}
                    className="pointer-events-auto"
                  />
                ) : (
                  <div className="p-3 space-y-1">
                    {[
                      { value: "7", label: "Last 7 days" },
                      { value: "30", label: "Last 30 days" },
                      { value: "90", label: "Last 90 days" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={timeRange === option.value ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setTimeRange(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue.toFixed(2)}
            change={stats.revenueChange}
            icon={DollarSign}
            prefix="$"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            title="New Users"
            value={stats.totalUsers}
            change={stats.userChange}
            icon={Users}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            change={stats.orderChange}
            icon={ShoppingCart}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            title="Avg Order Value"
            value={stats.avgOrderValue.toFixed(2)}
            change={0}
            icon={TrendingUp}
            prefix="$"
          />
        </motion.div>
      </div>

      {/* Live Events Feed */}
      {isLive && liveEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                Live Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {liveEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className={cn(
                        "p-2 rounded-full",
                        event.type === "order" ? "bg-green-500/10" : "bg-blue-500/10"
                      )}>
                        {event.type === "order" ? (
                          <ShoppingCart className="h-4 w-4 text-green-500" />
                        ) : (
                          <Users className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(event.timestamp, "HH:mm:ss")}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Geographic Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Geographic Distribution
                </CardTitle>
                <CardDescription>Orders and users by location worldwide</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Order hotspots</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{SAMPLE_LOCATIONS.length} locations</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <GeographicMap data={SAMPLE_LOCATIONS} loading={loading} />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {SAMPLE_LOCATIONS.slice(0, 5).map((loc, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">{loc.city}</p>
                  <p className="font-semibold text-lg">{loc.orders}</p>
                  <p className="text-xs text-green-500">${loc.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Daily revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* User Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Growth
              </CardTitle>
              <CardDescription>Cumulative user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#0891b2"
                      strokeWidth={2}
                      dot={false}
                      name="Total Users"
                    />
                    <Line
                      type="monotone"
                      dataKey="newUsers"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      name="New Users"
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Daily Orders
              </CardTitle>
              <CardDescription>Number of orders per day</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyOrdersData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="orders" 
                      fill="#14b8a6" 
                      radius={[4, 4, 0, 0]}
                      name="Orders"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Order Status
              </CardTitle>
              <CardDescription>Distribution of order statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {orderStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No order data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Product Performance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Top Selling Products
            </CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.title}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-500">${product.revenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{product.unitsSold} units</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <Badge variant={product.stock === 0 ? "destructive" : product.stock < 10 ? "secondary" : "outline"}>
                        {product.stock} in stock
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No product data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Revenue & Inventory Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Revenue by Category
              </CardTitle>
              <CardDescription>Sales distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : categoryRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryRevenue}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="revenue"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryRevenue.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Inventory Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Inventory Status
              </CardTitle>
              <CardDescription>Stock levels by category</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : inventoryTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryTrends} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      dataKey="category" 
                      type="category"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="inStock" stackId="a" fill="#14b8a6" name="In Stock" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="lowStock" stackId="a" fill="#f59e0b" name="Low Stock" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="outOfStock" stackId="a" fill="#ef4444" name="Out of Stock" radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No inventory data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Inventory Alerts */}
      {inventoryTrends.some(t => t.lowStock > 0 || t.outOfStock > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                Inventory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inventoryTrends
                  .filter(t => t.lowStock > 0 || t.outOfStock > 0)
                  .map((trend) => (
                    <div key={trend.category} className="p-4 rounded-lg bg-card border">
                      <p className="font-medium">{trend.category}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        {trend.lowStock > 0 && (
                          <span className="text-amber-500">{trend.lowStock} low stock</span>
                        )}
                        {trend.outOfStock > 0 && (
                          <span className="text-red-500">{trend.outOfStock} out of stock</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Seller Performance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Top Sellers
                </CardTitle>
                <CardDescription>Best performing sellers by revenue</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Percent className="h-4 w-4" />
                <span>{COMMISSION_RATE * 100}% platform commission</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : topSellers.length > 0 ? (
              <div className="space-y-4">
                {topSellers.slice(0, 5).map((seller, index) => (
                  <div key={seller.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      {index === 0 ? (
                        <Crown className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <span className="text-primary font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{seller.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{seller.email}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Orders</p>
                      <p className="font-semibold">{seller.totalOrders}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Products</p>
                      <p className="font-semibold">{seller.totalProducts}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Avg Order</p>
                      <p className="font-semibold">${seller.avgOrderValue.toFixed(2)}</p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="font-semibold text-green-500">${seller.totalRevenue.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Commission: ${seller.commissionEarned.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No seller data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Seller Revenue & Commission Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Seller Sales Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Seller Sales Trends
              </CardTitle>
              <CardDescription>Revenue over time for top 5 sellers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : sellerTrends.length > 0 && topSellers.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sellerTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                    />
                    <Legend />
                    {topSellers.slice(0, 5).map((seller, index) => (
                      <Line
                        key={seller.id}
                        type="monotone"
                        dataKey={seller.name}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Commission Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Commission Summary
              </CardTitle>
              <CardDescription>Platform earnings from seller commissions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : topSellers.length > 0 ? (
                <div className="space-y-6">
                  {/* Total Commission Card */}
                  <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Total Platform Commission</p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      ${topSellers.reduce((sum, s) => sum + s.commissionEarned, 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      From ${topSellers.reduce((sum, s) => sum + s.totalRevenue, 0).toFixed(2)} in total sales
                    </p>
                  </div>
                  
                  {/* Commission by Seller */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Commission by Seller</p>
                    {topSellers.slice(0, 5).map((seller, index) => (
                      <div key={seller.id} className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="flex-1 text-sm truncate">{seller.name}</span>
                        <span className="text-sm font-medium">${seller.commissionEarned.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Commission Rate Info */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Current commission rate:</span>
                    <span className="font-medium">{COMMISSION_RATE * 100}%</span>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No commission data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}