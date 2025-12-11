import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

export function CartDrawer() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg bg-white">
        <SheetHeader className="space-y-2.5 pr-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
            {totalItems > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {totalItems}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-muted p-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">
                Add items to your cart to see them here
              </p>
            </div>
            <Button asChild onClick={() => setIsCartOpen(false)}>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="py-4"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/product/${item.id}`}
                            onClick={() => setIsCartOpen(false)}
                            className="font-medium hover:text-primary line-clamp-2"
                          >
                            {item.title}
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 rounded-lg border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={item.quantity >= item.stock_quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Price */}
                          <span className="font-semibold text-primary">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>

            {/* Footer */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Subtotal ({totalItems} items)
                </span>
                <span className="text-lg font-bold">{formatPrice(totalPrice)}</span>
              </div>

              <div className="flex flex-col gap-2">
                <Button asChild size="lg" onClick={() => setIsCartOpen(false)}>
                  <Link to="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsCartOpen(false)}
                  asChild
                >
                  <Link to="/products">Continue Shopping</Link>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
