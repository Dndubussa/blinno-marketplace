import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowDownCircle,
  Check,
  X,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Banknote,
  User,
  Phone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

interface WithdrawalRequest {
  id: string;
  seller_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  payment_method: string;
  phone_number: string;
  status: string;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  processing: { label: "Processing", variant: "secondary", icon: RefreshCw },
  completed: { label: "Completed", variant: "default", icon: Check },
  failed: { label: "Failed", variant: "destructive", icon: X },
};

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: withdrawals, isLoading, refetch } = useQuery({
    queryKey: ["admin-withdrawals", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: withdrawalData, error } = await query;
      if (error) throw error;

      // Fetch profiles separately
      const sellerIds = [...new Set(withdrawalData?.map((w) => w.seller_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", sellerIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      return withdrawalData?.map((w) => ({
        ...w,
        profiles: profilesMap.get(w.seller_id) || { full_name: null, email: null },
      })) as WithdrawalRequest[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-withdrawal-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("status, amount, net_amount");

      if (error) throw error;

      const pending = data?.filter((w) => w.status === "pending") || [];
      const processing = data?.filter((w) => w.status === "processing") || [];
      const completed = data?.filter((w) => w.status === "completed") || [];

      return {
        pendingCount: pending.length,
        pendingAmount: pending.reduce((sum, w) => sum + Number(w.amount), 0),
        processingCount: processing.length,
        processingAmount: processing.reduce((sum, w) => sum + Number(w.amount), 0),
        completedCount: completed.length,
        completedAmount: completed.reduce((sum, w) => sum + Number(w.net_amount), 0),
      };
    },
  });

  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ withdrawalId, action, reason }: { withdrawalId: string; action: "approve" | "reject"; reason?: string }) => {
      const withdrawal = withdrawals?.find((w) => w.id === withdrawalId);
      if (!withdrawal) throw new Error("Withdrawal not found");

      const newStatus = action === "approve" ? "completed" : "failed";
      
      const { error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
          error_message: action === "reject" ? reason : null,
        })
        .eq("id", withdrawalId);

      if (updateError) throw updateError;

      // Send email notification
      if (withdrawal.profiles?.email) {
        await supabase.functions.invoke("withdrawal-notification", {
          body: {
            email: withdrawal.profiles.email,
            sellerName: withdrawal.profiles.full_name,
            withdrawalId: withdrawal.id,
            amount: withdrawal.amount,
            fee: withdrawal.fee,
            netAmount: withdrawal.net_amount,
            status: newStatus,
            paymentMethod: withdrawal.payment_method,
            errorMessage: action === "reject" ? reason : undefined,
          },
        });
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawal-stats"] });
      toast.success(
        variables.action === "approve"
          ? "Withdrawal approved and marked as completed"
          : "Withdrawal rejected"
      );
      setSelectedWithdrawal(null);
      setActionType(null);
      setRejectReason("");
    },
    onError: (error) => {
      toast.error("Failed to process withdrawal: " + error.message);
    },
  });

  const filteredWithdrawals = withdrawals?.filter((w) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      w.id.toLowerCase().includes(search) ||
      w.profiles?.full_name?.toLowerCase().includes(search) ||
      w.profiles?.email?.toLowerCase().includes(search) ||
      w.phone_number.includes(search)
    );
  });

  const handleAction = (withdrawal: WithdrawalRequest, action: "approve" | "reject") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
  };

  const confirmAction = () => {
    if (!selectedWithdrawal || !actionType) return;
    processWithdrawalMutation.mutate({
      withdrawalId: selectedWithdrawal.id,
      action: actionType,
      reason: actionType === "reject" ? rejectReason : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Withdrawal Requests</h1>
          <p className="text-muted-foreground">
            Manage and process seller withdrawal requests
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                TZS {stats?.pendingAmount?.toLocaleString() || 0} awaiting review
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.processingCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                TZS {stats?.processingAmount?.toLocaleString() || 0} being processed
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
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                TZS {stats?.completedAmount?.toLocaleString() || 0} total paid out
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            View and manage all withdrawal requests from sellers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by seller name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWithdrawals?.length === 0 ? (
            <div className="text-center py-8">
              <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No withdrawal requests found</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals?.map((withdrawal) => {
                    const config = statusConfig[withdrawal.status] || statusConfig.pending;
                    const StatusIcon = config.icon;

                    return (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {withdrawal.profiles?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {withdrawal.phone_number}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">TZS {withdrawal.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              Fee: TZS {withdrawal.fee.toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          TZS {withdrawal.net_amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase">
                            {withdrawal.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                          {withdrawal.error_message && (
                            <p className="text-xs text-destructive mt-1 max-w-[150px] truncate">
                              {withdrawal.error_message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(withdrawal.created_at), "MMM d, yyyy")}
                          <br />
                          <span className="text-xs">
                            {format(new Date(withdrawal.created_at), "h:mm a")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {(withdrawal.status === "pending" || withdrawal.status === "processing") && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAction(withdrawal, "approve")}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAction(withdrawal, "reject")}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedWithdrawal && !!actionType} onOpenChange={() => { setSelectedWithdrawal(null); setActionType(null); setRejectReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Withdrawal" : "Reject Withdrawal"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will mark the withdrawal as completed and notify the seller."
                : "Please provide a reason for rejecting this withdrawal request."}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seller</span>
                  <span className="font-medium">{selectedWithdrawal.profiles?.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">TZS {selectedWithdrawal.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net Payout</span>
                  <span className="font-semibold text-primary">TZS {selectedWithdrawal.net_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{selectedWithdrawal.phone_number}</span>
                </div>
              </div>

              {actionType === "reject" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rejection Reason</label>
                  <Textarea
                    placeholder="Enter reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedWithdrawal(null); setActionType(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={confirmAction}
              disabled={processWithdrawalMutation.isPending || (actionType === "reject" && !rejectReason)}
            >
              {processWithdrawalMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : actionType === "approve" ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              {actionType === "approve" ? "Approve & Complete" : "Reject Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
