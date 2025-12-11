import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { motion, AnimatePresence } from "framer-motion";

export function CartButton() {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => setIsCartOpen(true)}
    >
      <ShoppingCart className="h-5 w-5" />
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.span
            key="cart-count"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            {totalItems > 99 ? "99+" : totalItems}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
