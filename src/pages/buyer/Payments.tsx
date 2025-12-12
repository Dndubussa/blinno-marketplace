import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CreditCard,
  Smartphone,
  Plus,
  Check,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
} from "lucide-react";
import { generatePaymentReceipt } from "@/lib/generateReceipt";
import { format } from "date-fns";

type MobileNetwork = "MPESA" | "TIGOPESA" | "AIRTELMONEY" | "HALOPESA";

interface PaymentTransaction {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  network: string;
  phone_number: string;
  reference: string;
  status: string;
  description: string | null;
  created_at: string;
}

const networkLogos: Record<MobileNetwork, { name: string; color: string }> = {
  MPESA: { name: "M-Pesa", color: "bg-green-500" },
  TIGOPESA: { name: "Tigo Pesa", color: "bg-blue-500" },
  AIRTELMONEY: { name: "Airtel Money", color: "bg-red-500" },
  HALOPESA: { name: "Halopesa", color: "bg-orange-500" },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: "Failed", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: <AlertCircle className="h-3 w-3" /> },
};

export default function BuyerPayments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [newMethod, setNewMethod] = useState({
    network: "" as MobileNetwork | "",
    phone: "",
  });

  // Fetch payment transactions - memoized to prevent loops
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else {
      setTransactions(data || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Real-time subscription for payment updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("payment-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Payment update:", payload);
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTransactions]);

  const handleTestPayment = async () => {
    if (!newMethod.network || !newMethod.phone) {
      toast({
        title: "Missing information",
        description: "Please select a network and enter your phone number",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      const { data, error } = await supabase.functions.invoke("flutterwave-payment", {
        body: {
          action: "initiate",
          amount: 100,
          currency: "TZS",
          phone_number: newMethod.phone,
          network: newMethod.network,
          reference: `TEST-${Date.now()}`,
          description: "Test payment - Blinno",
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Payment initiated",
          description: "Check your phone for the payment prompt",
        });
        fetchTransactions();
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleRetryPayment = async (tx: PaymentTransaction) => {
    setRetryingId(tx.id);

    try {
      const newReference = `RETRY-${tx.reference.replace("RETRY-", "")}-${Date.now()}`;
      
      const { data, error } = await supabase.functions.invoke("flutterwave-payment", {
        body: {
          action: "initiate",
          amount: tx.amount,
          currency: tx.currency,
          phone_number: tx.phone_number,
          network: tx.network,
          reference: newReference,
          description: `Retry: ${tx.description || "Payment"}`,
          order_id: tx.order_id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Payment initiated",
          description: "Check your phone for the payment prompt",
        });
        fetchTransactions();
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (error: any) {
      toast({
        title: "Retry failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payment Methods & History</h1>
        <p className="text-muted-foreground">
          Manage your mobile money payments and view transaction history
        </p>
      </div>

      {/* ClickPesa Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Mobile Money Payments
              </h3>
              <p className="text-sm text-muted-foreground">
                Pay securely with M-Pesa, Tigo Pesa, Airtel Money, or Halopesa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Your recent ClickPesa payment transactions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                                <TableHead>Description</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const status = statusConfig[tx.status] || statusConfig.pending;
                    const network = networkLogos[tx.network as MobileNetwork];
                    const canRetry = tx.status === "failed" || tx.status === "cancelled";
                    
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(tx.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {tx.reference}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded ${network?.color || "bg-gray-500"} flex items-center justify-center text-white text-xs font-bold`}>
                              {tx.network.charAt(0)}
                            </div>
                            <span className="text-sm">{network?.name || tx.network}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatAmount(tx.amount, tx.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {tx.description || "-"}
                        </TableCell>
                        <TableCell>
                          {tx.status === "completed" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generatePaymentReceipt(tx)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Receipt
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {canRetry && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryPayment(tx)}
                              disabled={retryingId === tx.id}
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                              {retryingId === tx.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Retry
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No payment transactions yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Test Payment
          </CardTitle>
          <CardDescription>
            Test your mobile money number with a small payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mobile Network</Label>
              <Select
                value={newMethod.network}
                onValueChange={(value) =>
                  setNewMethod({ ...newMethod, network: value as MobileNetwork })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MPESA">M-Pesa (Vodacom)</SelectItem>
                  <SelectItem value="TIGOPESA">Tigo Pesa</SelectItem>
                  <SelectItem value="AIRTELMONEY">Airtel Money</SelectItem>
                  <SelectItem value="HALOPESA">Halopesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="+255 XXX XXX XXX"
                value={newMethod.phone}
                onChange={(e) =>
                  setNewMethod({ ...newMethod, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleTestPayment}
              disabled={isTesting || !newMethod.network || !newMethod.phone}
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Test Payment (100 TZS)
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            A small test payment of 100 TZS will be initiated to verify your number.
            This amount will be added to your Blinno wallet balance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
