import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, Clock, CheckCircle, XCircle, Truck, Mail, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendOrderStatusNotification, sendShippingNotification } from "@/lib/notifications";
import { format } from "date-fns";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  order_id: string;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
  products: {
    title: string;
    category: string;
  } | null;
  orders: {
    id: string;
    status: string;
    buyer_id: string;
    total_amount: number;
    tracking_number: string | null;
    carrier: string | null;
  } | null;
}

interface BuyerProfile {
  id: string;
  email: string | null;
  full_name: string | null;
}

const statusConfig: Record<string, { icon: typeof Package; color: string }> = {
  pending: { icon: Clock, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  processing: { icon: Package, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  shipped: { icon: Truck, color: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
  delivered: { icon: CheckCircle, color: "bg-green-500/10 text-green-500 border-green-500/20" },
  cancelled: { icon: XCircle, color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const CARRIERS = ["UPS", "FedEx", "USPS", "DHL", "Other"];

export default function Orders() {
  const { user } = useAuth();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [buyerProfiles, setBuyerProfiles] = useState<Record<string, BuyerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Shipping dialog state
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [sendingShipping, setSendingShipping] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          id,
          order_id,
          quantity,
          price_at_purchase,
          created_at,
          products (title, category),
          orders (id, status, buyer_id, total_amount, tracking_number, carrier)
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        setOrderItems(data || []);
        
        // Fetch buyer profiles
        const buyerIds = [...new Set(data?.map(item => item.orders?.buyer_id).filter(Boolean) as string[])];
        if (buyerIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .in("id", buyerIds);
          
          if (profiles) {
            const profileMap: Record<string, BuyerProfile> = {};
            profiles.forEach(p => { profileMap[p.id] = p; });
            setBuyerProfiles(profileMap);
          }
        }
      }
      setLoading(false);
    };

    fetchOrders();

    // Set up real-time subscription for orders
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
          filter: `seller_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Order change detected:", payload);
          fetchOrders();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("Order status change detected:", payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleStatusChange = async (orderId: string, newStatus: string, buyerId: string) => {
    setUpdatingOrder(orderId);
    
    try {
      // Update order status
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Update local state
      setOrderItems(prev => 
        prev.map(item => 
          item.orders?.id === orderId 
            ? { ...item, orders: { ...item.orders!, status: newStatus } }
            : item
        )
      );

      // Send email notification
      const buyerProfile = buyerProfiles[buyerId];
      if (buyerProfile?.email) {
        const result = await sendOrderStatusNotification({
          orderId,
          newStatus,
          buyerEmail: buyerProfile.email,
          buyerName: buyerProfile.full_name || undefined
        });
        
        if (result.success) {
          toast.success("Status updated and notification sent", {
            description: `Email sent to ${buyerProfile.email}`,
            icon: <Mail className="h-4 w-4" />,
          });
        } else {
          toast.success("Status updated", {
            description: "Email notification could not be sent",
          });
        }
      } else {
        toast.success("Order status updated");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const openShippingDialog = (orderId: string) => {
    const order = orderItems.find(item => item.orders?.id === orderId);
    setSelectedOrderId(orderId);
    setTrackingNumber(order?.orders?.tracking_number || "");
    setCarrier(order?.orders?.carrier || "");
    setShippingDialogOpen(true);
  };

  const handleAddTracking = async () => {
    if (!selectedOrderId || !trackingNumber || !carrier) {
      toast.error("Please fill in all fields");
      return;
    }

    setSendingShipping(true);
    
    try {
      // Update order with tracking info
      const { error } = await supabase
        .from("orders")
        .update({ 
          tracking_number: trackingNumber, 
          carrier: carrier,
          status: "shipped",
          shipped_at: new Date().toISOString()
        })
        .eq("id", selectedOrderId);

      if (error) throw error;

      // Update local state
      setOrderItems(prev => 
        prev.map(item => 
          item.orders?.id === selectedOrderId 
            ? { 
                ...item, 
                orders: { 
                  ...item.orders!, 
                  status: "shipped",
                  tracking_number: trackingNumber,
                  carrier: carrier
                } 
              }
            : item
        )
      );

      // Get buyer info and send shipping notification
      const order = orderItems.find(item => item.orders?.id === selectedOrderId);
      const buyerId = order?.orders?.buyer_id;
      if (buyerId) {
        const buyerProfile = buyerProfiles[buyerId];
        if (buyerProfile?.email) {
          await sendShippingNotification({
            orderId: selectedOrderId,
            trackingNumber,
            carrier,
            buyerEmail: buyerProfile.email,
            buyerName: buyerProfile.full_name || undefined
          });
          
          toast.success("Tracking added and shipping notification sent", {
            description: `Email sent to ${buyerProfile.email}`,
            icon: <Truck className="h-4 w-4" />,
          });
        }
      }

      setShippingDialogOpen(false);
      setTrackingNumber("");
      setCarrier("");
    } catch (error) {
      console.error("Error adding tracking:", error);
      toast.error("Failed to add tracking information");
    } finally {
      setSendingShipping(false);
    }
  };

  // Calculate stats
  const stats = {
    total: orderItems.length,
    pending: orderItems.filter((o) => o.orders?.status === "pending").length,
    processing: orderItems.filter((o) => o.orders?.status === "processing").length,
    delivered: orderItems.filter((o) => o.orders?.status === "delivered").length,
  };

  const filteredOrders = orderItems.filter(
    (item) =>
      item.products?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.orders?.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by order ID to avoid duplicates in display
  const uniqueOrders = filteredOrders.reduce((acc, item) => {
    if (item.orders?.id && !acc.find(o => o.orders?.id === item.orders?.id)) {
      acc.push(item);
    }
    return acc;
  }, [] as OrderItem[]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          View and manage orders for your products. Update status to send email notifications.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { title: "Total Orders", value: stats.total, icon: Package },
          { title: "Pending", value: stats.pending, icon: Clock },
          { title: "Processing", value: stats.processing, icon: Package },
          { title: "Delivered", value: stats.delivered, icon: CheckCircle },
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
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border border-border rounded-lg overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="h-12 animate-pulse bg-muted rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : uniqueOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No orders yet. Orders will appear here when customers purchase your products.
                </TableCell>
              </TableRow>
            ) : (
              uniqueOrders.map((item) => {
                const status = item.orders?.status || "pending";
                const StatusIcon = statusConfig[status]?.icon || Package;
                const buyerId = item.orders?.buyer_id || "";
                const buyer = buyerProfiles[buyerId];
                const isUpdating = updatingOrder === item.orders?.id;
                const hasTracking = !!item.orders?.tracking_number;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {item.orders?.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.products?.title || "Unknown Product"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{buyer?.full_name || "Customer"}</p>
                        <p className="text-muted-foreground text-xs">{buyer?.email || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      ${(item.price_at_purchase * item.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={status}
                        onValueChange={(value) => 
                          handleStatusChange(item.orders!.id, value, buyerId)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger className={`w-[140px] ${statusConfig[status]?.color}`}>
                          <SelectValue>
                            <span className="flex items-center gap-2">
                              <StatusIcon className="h-3 w-3" />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => {
                            const Icon = statusConfig[s]?.icon || Package;
                            return (
                              <SelectItem key={s} value={s}>
                                <span className="flex items-center gap-2">
                                  <Icon className="h-3 w-3" />
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {hasTracking ? (
                        <div className="text-xs">
                          <p className="font-medium">{item.orders?.carrier}</p>
                          <p className="text-muted-foreground">{item.orders?.tracking_number}</p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openShippingDialog(item.orders!.id)}
                          className="text-xs"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Add Tracking
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(item.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Shipping Dialog */}
      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  {CARRIERS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            <Button 
              onClick={handleAddTracking} 
              disabled={sendingShipping}
              className="w-full"
            >
              {sendingShipping ? "Sending..." : "Add Tracking & Notify Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}