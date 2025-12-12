import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Percent,
  Calendar,
  RefreshCw,
  Download,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
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
import { format, subDays, eachDayOfInterval } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PaymentTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  network: string;
  phone_number: string;
  reference: string;
  status: string;
  created_at: string;
}

interface PaymentStats {
  totalVolume: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  successRate: number;
  avgTransactionValue: number;
  volumeChange: number;
}

interface NetworkStats {
  network: string;
  volume: number;
  count: number;
  successRate: number;
}

const COLORS = ["#1BA94C", "#2196F3", "#f59e0b", "#ef4444", "#8b5cf6"];

const networkNames: Record<string, string> = {
  MPESA: "M-Pesa",
  TIGOPESA: "Tigo Pesa",
  AIRTELMONEY: "Airtel Money",
  HALOPESA: "Halopesa",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: "Failed", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: <AlertCircle className="h-3 w-3" /> },
};

export default function PaymentAnalytics() {
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalVolume: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    successRate: 0,
    avgTransactionValue: 0,
    volumeChange: 0,
  });
  const [networkStats, setNetworkStats] = useState<NetworkStats[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  // Memoize fetchPaymentData to prevent loops
  const fetchPaymentData = useCallback(async () => {
    setLoading(true);
    const days = parseInt(timeRange);
    const startDate = subDays(new Date(), days);
    const previousStartDate = subDays(startDate, days);

    try {
      // Fetch current period transactions
      const { data: currentData, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      // Fetch previous period for comparison
      const { data: previousData } = await supabase
        .from("payment_transactions")
        .select("*")
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      if (error) throw error;

      if (currentData) {
        setTransactions(currentData);
        processStats(currentData, previousData || []);
        processNetworkStats(currentData);
        processDailyData(currentData, startDate);
        processStatusData(currentData);
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("payment-analytics")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_transactions",
        },
        () => {
          fetchPaymentData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPaymentData]);

  const processStats = (current: PaymentTransaction[], previous: PaymentTransaction[]) => {
    const totalVolume = current
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const previousVolume = previous
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const successfulTransactions = current.filter((t) => t.status === "completed").length;
    const failedTransactions = current.filter((t) => t.status === "failed" || t.status === "cancelled").length;
    const pendingTransactions = current.filter((t) => t.status === "pending" || t.status === "processing").length;

    const volumeChange = previousVolume > 0 
      ? ((totalVolume - previousVolume) / previousVolume) * 100 
      : 100;

    setStats({
      totalVolume,
      totalTransactions: current.length,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
      successRate: current.length > 0 ? (successfulTransactions / current.length) * 100 : 0,
      avgTransactionValue: successfulTransactions > 0 ? totalVolume / successfulTransactions : 0,
      volumeChange,
    });
  };

  const processNetworkStats = (data: PaymentTransaction[]) => {
    const networkMap = new Map<string, { volume: number; count: number; successful: number }>();

    data.forEach((t) => {
      const existing = networkMap.get(t.network) || { volume: 0, count: 0, successful: 0 };
      existing.count++;
      if (t.status === "completed") {
        existing.volume += Number(t.amount);
        existing.successful++;
      }
      networkMap.set(t.network, existing);
    });

    const stats: NetworkStats[] = Array.from(networkMap.entries()).map(([network, data]) => ({
      network: networkNames[network] || network,
      volume: data.volume,
      count: data.count,
      successRate: data.count > 0 ? (data.successful / data.count) * 100 : 0,
    }));

    setNetworkStats(stats.sort((a, b) => b.volume - a.volume));
  };

  const processDailyData = (data: PaymentTransaction[], startDate: Date) => {
    const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });
    
    const dailyMap = new Map<string, { volume: number; count: number; successful: number; failed: number }>();
    
    dateRange.forEach((date) => {
      dailyMap.set(format(date, "yyyy-MM-dd"), { volume: 0, count: 0, successful: 0, failed: 0 });
    });

    data.forEach((t) => {
      const dateKey = format(new Date(t.created_at), "yyyy-MM-dd");
      const existing = dailyMap.get(dateKey);
      if (existing) {
        existing.count++;
        if (t.status === "completed") {
          existing.volume += Number(t.amount);
          existing.successful++;
        } else if (t.status === "failed" || t.status === "cancelled") {
          existing.failed++;
        }
      }
    });

    const chartData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date: format(new Date(date), "MMM d"),
      volume: data.volume,
      transactions: data.count,
      successful: data.successful,
      failed: data.failed,
    }));

    setDailyData(chartData);
  };

  const processStatusData = (data: PaymentTransaction[]) => {
    const statusMap = new Map<string, number>();
    
    data.forEach((t) => {
      statusMap.set(t.status, (statusMap.get(t.status) || 0) + 1);
    });

    const chartData = Array.from(statusMap.entries()).map(([status, count]) => ({
      name: statusConfig[status]?.label || status,
      value: count,
      status,
    }));

    setStatusData(chartData);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Payment Analytics Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 30);
    doc.text(`Period: Last ${timeRange} days`, 14, 36);

    // Summary stats
    doc.setFontSize(14);
    doc.text("Summary", 14, 50);
    
    autoTable(doc, {
      startY: 55,
      head: [["Metric", "Value"]],
      body: [
        ["Total Volume", formatAmount(stats.totalVolume)],
        ["Total Transactions", stats.totalTransactions.toString()],
        ["Successful", stats.successfulTransactions.toString()],
        ["Failed", stats.failedTransactions.toString()],
        ["Success Rate", `${stats.successRate.toFixed(1)}%`],
        ["Avg Transaction", formatAmount(stats.avgTransactionValue)],
      ],
      theme: "grid",
    });

    // Network breakdown
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("Network Breakdown", 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [["Network", "Volume", "Transactions", "Success Rate"]],
      body: networkStats.map((n) => [
        n.network,
        formatAmount(n.volume),
        n.count.toString(),
        `${n.successRate.toFixed(1)}%`,
      ]),
      theme: "grid",
    });

    doc.save(`Payment-Analytics-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Analytics</h1>
          <p className="text-muted-foreground">ClickPesa transaction insights and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="text-2xl font-bold">{formatAmount(stats.totalVolume)}</p>
                  <div className="flex items-center mt-1">
                    {stats.volumeChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={stats.volumeChange >= 0 ? "text-green-500 text-sm" : "text-red-500 text-sm"}>
                      {Math.abs(stats.volumeChange).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.successfulTransactions} of {stats.totalTransactions}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <Percent className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Transaction</p>
                  <p className="text-2xl font-bold">{formatAmount(stats.avgTransactionValue)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Per successful payment</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingTransactions}</p>
                  <p className="text-sm text-muted-foreground mt-1">Awaiting confirmation</p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>Daily payment volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1BA94C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1BA94C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [formatAmount(value), "Volume"]}
                  contentStyle={{ borderRadius: "8px" }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#1BA94C"
                  strokeWidth={2}
                  fill="url(#volumeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Transaction outcomes breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.status === "completed"
                          ? "#22c55e"
                          : entry.status === "failed"
                          ? "#ef4444"
                          : entry.status === "pending"
                          ? "#f59e0b"
                          : COLORS[index % COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Network Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Network Performance
          </CardTitle>
          <CardDescription>Volume and success rates by mobile money network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={networkStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="network" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [formatAmount(value), "Volume"]} />
                <Bar dataKey="volume" fill="#1BA94C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-4">
              {networkStats.map((network, index) => (
                <div key={network.network} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium">{network.network}</p>
                      <p className="text-sm text-muted-foreground">{network.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatAmount(network.volume)}</p>
                    <p className={`text-sm ${network.successRate >= 80 ? "text-green-600" : network.successRate >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                      {network.successRate.toFixed(1)}% success
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activity across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 10).map((tx) => {
                const status = statusConfig[tx.status] || statusConfig.pending;
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">{tx.reference}</TableCell>
                    <TableCell>{networkNames[tx.network] || tx.network}</TableCell>
                    <TableCell className="font-medium">{formatAmount(tx.amount)}</TableCell>
                    <TableCell>
                      <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
