import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  MapPin, 
  ShoppingBag, 
  ChevronLeft,
  Check,
  Loader2,
  Smartphone,
  Phone,
  XCircle
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const shippingSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  address: z.string().min(5, "Address must be at least 5 characters").max(200),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  zipCode: z.string().min(4, "Zip code is required").max(20),
  country: z.string().min(2, "Country is required").max(100),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

type MobileNetwork = "MPESA" | "TIGOPESA" | "AIRTELMONEY" | "HALOPESA";

const mobileNetworks: { id: MobileNetwork; name: string; color: string }[] = [
  { id: "MPESA", name: "M-Pesa", color: "bg-green-500" },
  { id: "TIGOPESA", name: "Tigo Pesa", color: "bg-blue-500" },
  { id: "AIRTELMONEY", name: "Airtel Money", color: "bg-red-500" },
  { id: "HALOPESA", name: "Halopesa", color: "bg-orange-500" },
];

import { useCurrency } from "@/hooks/useCurrency";
import { convertCurrency, formatPrice as formatPriceUtil, Currency } from "@/lib/currency";

// Keep formatPriceTZS for payment processing (ClickPesa requires TZS)
const formatPriceTZS = (price: number) => {
  // Convert USD to TZS (approximate rate)
  const tzsAmount = price * 2500;
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(tzsAmount);
};

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice, userCurrency } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<MobileNetwork>("MPESA");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentStep, setPaymentStep] = useState<"shipping" | "payment" | "processing">("shipping");
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed">("pending");
  const [pollCount, setPollCount] = useState(0);

  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: "",
      email: user?.email || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Tanzania",
    },
  });

  const shippingCost = totalPrice >= 100 ? 0 : 9.99;
  const tax = totalPrice * 0.08;
  const orderTotal = totalPrice + shippingCost + tax;
  const orderTotalTZS = orderTotal * 2500; // Convert to TZS

  const onShippingSubmit = async (data: ShippingFormData) => {
    if (!user) {
      toast.error("Please sign in to complete your order");
      navigate("/auth");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setShippingData(data);
    setPaymentPhone(data.phone);
    setPaymentStep("payment");
  };

  const processPayment = async () => {
    if (!user || !shippingData) {
      toast.error("Please complete shipping information first");
      return;
    }

    if (!paymentPhone || paymentPhone.length < 10) {
      toast.error("Please enter a valid phone number for payment");
      return;
    }

    setIsProcessing(true);
    setPaymentStep("processing");

    try {
      // Create the order first
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: user.id,
          total_amount: orderTotal,
          status: "pending",
          shipping_address: {
            fullName: shippingData.fullName,
            email: shippingData.email,
            phone: shippingData.phone,
            address: shippingData.address,
            city: shippingData.city,
            state: shippingData.state,
            zipCode: shippingData.zipCode,
            country: shippingData.country,
          },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        seller_id: item.seller_id,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Format phone number for ClickPesa (ensure it starts with 255)
      let formattedPhone = paymentPhone.replace(/\D/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "255" + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("255")) {
        formattedPhone = "255" + formattedPhone;
      }

      // Generate payment reference
      const reference = `ORDER-${order.id.substring(0, 8).toUpperCase()}`;

      // Initiate ClickPesa payment
      const { data: paymentResult, error: paymentError } = await supabase.functions.invoke(
        "clickpesa-payment",
        {
          body: {
            action: "initiate",
            amount: orderTotalTZS,
            currency: "TZS",
            phone_number: formattedPhone,
            network: selectedNetwork,
            reference: reference,
            description: `Blinno Order Payment - ${items.length} item(s)`,
            order_id: order.id,
          },
        }
      );

      if (paymentError) {
        console.error("Payment initiation error:", paymentError);
        throw new Error("Failed to initiate payment. Please try again.");
      }

      if (!paymentResult?.success) {
        throw new Error(paymentResult?.error || "Payment initiation failed");
      }

      // Store payment reference for status polling
      setPaymentReference(reference);

      // Show USSD push notification
      toast.success(
        `A USSD prompt has been sent to ${formattedPhone}. Please enter your PIN to complete the payment.`,
        { duration: 10000 }
      );

      // Send order confirmation email
      await supabase.functions.invoke("order-confirmation", {
        body: {
          orderId: order.id,
          email: shippingData.email,
          customerName: shippingData.fullName,
          items: items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
          total: orderTotal,
          shippingAddress: shippingData,
        },
      });

      setOrderId(order.id);
      setOrderComplete(true);
      clearCart();
      toast.success("Order placed successfully! Complete the payment on your phone.");
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to place order");
      setPaymentStep("payment");
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment status polling
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentReference || !orderId || paymentStatus !== "pending") return;

    try {
      const { data, error } = await supabase.functions.invoke("clickpesa-payment", {
        body: {
          action: "check-status",
          reference: paymentReference,
          transaction_id: paymentReference,
        },
      });

      if (error) {
        console.error("Status check error:", error);
        return;
      }

      if (data?.data?.status === "COMPLETED") {
        setPaymentStatus("completed");
        toast.success("Payment completed successfully!");
      } else if (data?.data?.status === "FAILED" || data?.data?.status === "CANCELLED") {
        setPaymentStatus("failed");
        toast.error("Payment was not successful. Please try again.");
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  }, [paymentReference, orderId, paymentStatus]);

  // Poll for payment status every 5 seconds, up to 24 times (2 minutes)
  useEffect(() => {
    if (!orderComplete || !paymentReference || paymentStatus !== "pending" || pollCount >= 24) {
      return;
    }

    const interval = setInterval(() => {
      setPollCount((prev) => prev + 1);
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [orderComplete, paymentReference, paymentStatus, pollCount, checkPaymentStatus]);

  if (orderComplete && orderId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
                paymentStatus === "completed" 
                  ? "bg-green-500/10" 
                  : paymentStatus === "failed" 
                  ? "bg-red-500/10" 
                  : "bg-amber-500/10"
              }`}
            >
              {paymentStatus === "completed" ? (
                <Check className="h-10 w-10 text-green-500" />
              ) : paymentStatus === "failed" ? (
                <XCircle className="h-10 w-10 text-red-500" />
              ) : (
                <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
              )}
            </motion.div>
            
            <h1 className="text-3xl font-bold">
              {paymentStatus === "completed" 
                ? "Payment Successful!" 
                : paymentStatus === "failed"
                ? "Payment Failed"
                : "Order Confirmed!"}
            </h1>
            
            <p className="mt-2 text-muted-foreground">
              {paymentStatus === "completed" 
                ? "Your payment has been received. Your order is being processed."
                : paymentStatus === "failed"
                ? "The payment was not completed. Please try again or use a different payment method."
                : "Thank you for your purchase. Complete the payment on your phone."}
            </p>

            {paymentStatus === "pending" && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 max-w-md mx-auto">
                <p className="text-sm text-amber-600">
                  <Smartphone className="inline-block h-4 w-4 mr-1" />
                  Check your phone to complete the payment via {selectedNetwork}
                </p>
                <p className="text-xs text-amber-600/70 mt-2">
                  Checking payment status... ({pollCount}/24)
                </p>
              </div>
            )}

            {paymentStatus === "completed" && (
              <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4 max-w-md mx-auto">
                <p className="text-sm text-green-600">
                  <Check className="inline-block h-4 w-4 mr-1" />
                  Payment of {formatPriceTZS(orderTotal)} received
                </p>
              </div>
            )}

            <p className="mt-4 font-mono text-sm text-muted-foreground">
              Order ID: {orderId}
            </p>
            
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link to="/buyer/orders">View Order Status</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center pt-20">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
            <p className="mt-2 text-muted-foreground">
              Add some items to your cart to checkout
            </p>
            <Button asChild className="mt-6">
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <Link
            to="/products"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Shopping
          </Link>

          <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${paymentStep === "shipping" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${paymentStep === "shipping" ? "bg-primary text-primary-foreground" : "bg-green-500 text-white"}`}>
                {paymentStep !== "shipping" ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <span className="hidden sm:inline font-medium">Shipping</span>
            </div>
            <div className="h-px w-8 bg-border" />
            <div className={`flex items-center gap-2 ${paymentStep === "payment" || paymentStep === "processing" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${paymentStep === "payment" || paymentStep === "processing" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                2
              </div>
              <span className="hidden sm:inline font-medium">Payment</span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {paymentStep === "shipping" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onShippingSubmit)}
                        className="space-y-4"
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="john@example.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+255 712 345 678" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123 Main Street, Apt 4B"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Dar es Salaam" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Region</FormLabel>
                                <FormControl>
                                  <Input placeholder="Dar es Salaam" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="00000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tanzania" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {!user && (
                          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                            <p className="text-sm text-amber-600">
                              Please{" "}
                              <Link
                                to="/auth"
                                className="font-semibold underline hover:no-underline"
                              >
                                sign in
                              </Link>{" "}
                              to complete your order.
                            </p>
                          </div>
                        )}

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full"
                          disabled={!user}
                        >
                          Continue to Payment
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {(paymentStep === "payment" || paymentStep === "processing") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      Mobile Money Payment
                    </CardTitle>
                    <CardDescription>
                      Select your mobile money provider and enter your phone number
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Network Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Select Payment Method</Label>
                      <RadioGroup
                        value={selectedNetwork}
                        onValueChange={(value) => setSelectedNetwork(value as MobileNetwork)}
                        className="grid grid-cols-2 gap-4"
                        disabled={isProcessing}
                      >
                        {mobileNetworks.map((network) => (
                          <div key={network.id}>
                            <RadioGroupItem
                              value={network.id}
                              id={network.id}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={network.id}
                              className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                            >
                              <div className={`h-10 w-10 rounded-full ${network.color} flex items-center justify-center mb-2`}>
                                <Phone className="h-5 w-5 text-white" />
                              </div>
                              <span className="font-medium">{network.name}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Phone Number Input */}
                    <div className="space-y-2">
                      <Label htmlFor="payment-phone" className="text-base font-medium">
                        Mobile Money Number
                      </Label>
                      <Input
                        id="payment-phone"
                        type="tel"
                        placeholder="0712 345 678"
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                        disabled={isProcessing}
                        className="text-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the phone number registered with {selectedNetwork}
                      </p>
                    </div>

                    {/* Payment Info */}
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount to Pay</span>
                        <span className="font-bold text-lg">{formatPriceTZS(orderTotal)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ≈ {formatPrice(orderTotal)} USD
                      </p>
                    </div>

                    {/* Instructions */}
                    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                      <h4 className="font-medium text-blue-700 mb-2">How it works:</h4>
                      <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
                        <li>Click "Pay Now" to initiate the payment</li>
                        <li>You'll receive a USSD prompt on your phone</li>
                        <li>Enter your {selectedNetwork} PIN to confirm</li>
                        <li>Your order will be processed automatically</li>
                      </ol>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setPaymentStep("shipping")}
                        disabled={isProcessing}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                      <Button
                        onClick={processPayment}
                        size="lg"
                        className="flex-1"
                        disabled={isProcessing || !paymentPhone}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay Now ({formatPriceTZS(orderTotal)})
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-1">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>
                        {shippingCost === 0 ? (
                          <span className="text-green-500">Free</span>
                        ) : (
                          formatPrice(shippingCost)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (8%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <div className="text-right">
                      <span className="text-primary text-lg block">
                        {formatPrice(orderTotal)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ≈ {formatPriceTZS(orderTotal)}
                      </span>
                    </div>
                  </div>

                  {totalPrice < 100 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Add {formatPrice(100 - totalPrice)} more for free shipping!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
