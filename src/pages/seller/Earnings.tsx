import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  ArrowDownToLine, 
  DollarSign,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface BalanceData {
  total_earnings: number;
  available_balance: number;
  pending_withdrawals: number;
  total_withdrawn: number;
}

interface Earning {
  id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  created_at: string;
  order_id: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  fee: number;
  net_amount: number;
  payment_method: string;
  phone_number: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export default function SellerEarnings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch balance
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_seller_balance', { p_seller_id: user?.id });

      if (balanceError) throw balanceError;
      setBalance(balanceData?.[0] || null);

      // Fetch earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('seller_earnings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (earningsError) throw earningsError;
      setEarnings(earningsData || []);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (withdrawalsError) throw withdrawalsError;
      setWithdrawals(withdrawalsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber) {
      toast({
        title: "Phone Required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive"
      });
      return;
    }

    if (amount > (balance?.available_balance || 0)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough available balance",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('seller-withdrawal', {
        body: {
          amount,
          phoneNumber,
          paymentMethod
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Withdrawal Requested",
        description: `Your withdrawal of TZS ${amount.toLocaleString()} is being processed`
      });

      setWithdrawDialogOpen(false);
      setWithdrawAmount("");
      fetchData();

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Earnings & Payouts</h1>
          <p className="text-muted-foreground">Track your sales and withdraw your earnings</p>
        </div>
        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Earnings</DialogTitle>
              <DialogDescription>
                Transfer your earnings to your mobile money account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(balance?.available_balance || 0)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (TZS)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="tigopesa">Tigo Pesa</SelectItem>
                    <SelectItem value="airtelmoney">Airtel Money</SelectItem>
                    <SelectItem value="halopesa">Halopesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., 0755123456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span>{formatCurrency(parseFloat(withdrawAmount))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee (2%)</span>
                    <span>-{formatCurrency(parseFloat(withdrawAmount) * 0.02)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>You'll receive</span>
                    <span>{formatCurrency(parseFloat(withdrawAmount) * 0.98)}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleWithdraw} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Withdrawal'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(balance?.total_earnings || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(balance?.available_balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready to withdraw
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
                Pending Withdrawals
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(balance?.pending_withdrawals || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Being processed
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
                Total Withdrawn
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(balance?.total_withdrawn || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully paid out
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Withdrawal History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
            <CardDescription>Your payout requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowDownToLine className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No withdrawal requests yet</p>
                <p className="text-sm">Make a sale and withdraw your earnings</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        -{formatCurrency(withdrawal.fee)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(withdrawal.net_amount)}
                      </TableCell>
                      <TableCell className="uppercase text-xs">
                        {withdrawal.payment_method}
                      </TableCell>
                      <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Earnings History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
            <CardDescription>Your sales and commission breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No earnings yet</p>
                <p className="text-sm">Start selling to see your earnings here</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Net Earnings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(earning.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {earning.order_id?.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{formatCurrency(earning.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        -{formatCurrency(earning.platform_fee)}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(earning.net_amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(earning.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
