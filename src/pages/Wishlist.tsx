import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ShoppingBag, ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    products: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    books: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    creators: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    courses: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    services: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    events: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  };
  return colors[category] || "bg-muted text-muted-foreground";
};

export default function Wishlist() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      stock_quantity: item.stock_quantity,
      seller_id: item.seller_id,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <Link
            to="/products"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Heart className="h-8 w-8 text-primary" />
                My Wishlist
              </h1>
              <p className="text-muted-foreground mt-1">
                {items.length} item{items.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            {items.length > 0 && (
              <Button variant="outline" onClick={clearWishlist}>
                Clear All
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Your wishlist is empty</h3>
              <p className="text-muted-foreground mt-2 text-center max-w-md">
                Save items you love by clicking the heart icon on any product
              </p>
              <Button asChild className="mt-6">
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className={`absolute left-3 top-3 ${getCategoryColor(item.category)}`}
                      >
                        {item.category}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFromWishlist(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <Link
                        to={`/product/${item.id}`}
                        className="font-semibold hover:text-primary line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(item.price)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(item)}
                          disabled={item.stock_quantity === 0}
                        >
                          <ShoppingCart className="mr-1 h-4 w-4" />
                          Add to Cart
                        </Button>
                      </div>
                      {item.stock_quantity === 0 && (
                        <p className="mt-2 text-sm text-destructive">Out of stock</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
