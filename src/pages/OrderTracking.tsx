import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ChevronLeft,
  ShoppingBag,
  CreditCard,
  Box,
  Home
} from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/types";
import { useCurrency } from "@/hooks/useCurrency";
import { getProductImage } from "@/lib/imageUtils";

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const parseShippingAddress = (json: Json | null): ShippingAddress | null => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  return {
    fullName: String(obj.fullName || ''),
    email: String(obj.email || ''),
    phone: String(obj.phone || ''),
    address: String(obj.address || ''),
    city: String(obj.city || ''),
    state: String(obj.state || ''),
    zipCode: String(obj.zipCode || ''),
    country: String(obj.country || ''),
  };
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Order Placed", color: "bg-yellow-500", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-500", icon: CheckCircle2 },
  processing: { label: "Processing", color: "bg-indigo-500", icon: Box },
  shipped: { label: "Shipped", color: "bg-purple-500", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", color: "bg-orange-500", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-500", icon: Home },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: Package },
};

const statusOrder = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId && !!user,
  });

  const { data: orderItems } = useQuery({
    queryKey: ["order-items", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          *,
          products (
            id,
            title,
            images,
            category
          )
        `)
        .eq("order_id", orderId);

      if (error) throw error;
      return data;
    },
    enabled: !!orderId && !!user,
  });

  const currentStatusIndex = order ? statusOrder.indexOf(order.status) : -1;
  const shippingAddress = order ? parseShippingAddress(order.shipping_address) : null;

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center pt-20">
          <div className="text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h1 className="mt-4 text-2xl font-bold">Sign in to track your order</h1>
            <Button asChild className="mt-6">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center pt-20">
          <div className="text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h1 className="mt-4 text-2xl font-bold">Order not found</h1>
            <p className="mt-2 text-muted-foreground">
              The order you're looking for doesn't exist.
            </p>
            <Button asChild className="mt-6">
              <Link to="/profile">View My Orders</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <Link
            to="/profile"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Orders
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Order Tracking</h1>
              <p className="text-muted-foreground font-mono text-sm mt-1">
                Order ID: {order.id}
              </p>
            </div>
            <Badge
              className={`${statusConfig[order.status]?.color || "bg-gray-500"} text-white`}
            >
              {statusConfig[order.status]?.label || order.status}
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Delivery Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {statusOrder.filter(s => s !== "cancelled").map((status, index) => {
                      const config = statusConfig[status];
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      const Icon = config.icon;

                      return (
                        <motion.div
                          key={status}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-4 pb-8 last:pb-0"
                        >
                          {/* Line */}
                          {index < statusOrder.length - 1 && (
                            <div
                              className={`absolute left-5 mt-10 w-0.5 h-8 ${
                                isCompleted ? "bg-primary" : "bg-border"
                              }`}
                              style={{ top: `${index * 72}px` }}
                            />
                          )}
                          
                          {/* Icon */}
                          <div
                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                              isCompleted
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <p
                              className={`font-medium ${
                                isCompleted ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {config.label}
                            </p>
                            {isCurrent && (
                              <p className="text-sm text-primary mt-1">Current status</p>
                            )}
                            {status === "shipped" && order.shipped_at && isCompleted && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Shipped on {format(new Date(order.shipped_at), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {order.tracking_number && (
                    <div className="mt-6 p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Tracking Number</p>
                      <p className="font-mono font-medium">{order.tracking_number}</p>
                      {order.carrier && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Carrier: {order.carrier}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderItems?.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          {(() => {
                            const imageUrl = item.products ? getProductImage(item.products) : "/placeholder.svg";
                            return imageUrl !== "/placeholder.svg" ? (
                              <img
                                src={imageUrl}
                                alt={item.products?.title || "Product"}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg";
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex-1">
                          <Link
                            to={`/product/${item.product_id}`}
                            className="font-medium hover:text-primary"
                          >
                            {item.products?.title || "Product"}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatPrice(item.price_at_purchase)}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatPrice(item.quantity * item.price_at_purchase)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Date</span>
                    <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(order.total_amount)}</span>
                  </div>
                </CardContent>
              </Card>

              {shippingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{shippingAddress.fullName}</p>
                      <p className="text-muted-foreground">{shippingAddress.address}</p>
                      <p className="text-muted-foreground">
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                      </p>
                      <p className="text-muted-foreground">{shippingAddress.country}</p>
                      <Separator className="my-3" />
                      <p className="text-muted-foreground">{shippingAddress.phone}</p>
                      <p className="text-muted-foreground">{shippingAddress.email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button asChild variant="outline" className="w-full">
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
