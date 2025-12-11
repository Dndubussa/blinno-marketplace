import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import type { ViewMode } from "@/pages/Products";
import { Currency } from "@/lib/currency";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency?: string;
  category: string;
  images: string[] | null;
  stock_quantity: number;
  seller_id: string;
}

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
}

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

export function ProductCard({ product, viewMode }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const images = product.images && product.images.length > 0 ? product.images : ["/placeholder.svg"];
  const isOutOfStock = product.stock_quantity === 0;
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const hasMultipleImages = images.length > 1;

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const getImageSrc = (index: number) => {
    if (imageErrors.has(index) || !images[index]) {
      return "/placeholder.svg";
    }
    return images[index];
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] || null,
      stock_quantity: product.stock_quantity,
      seller_id: product.seller_id,
    });
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex gap-4 rounded-xl border border-border bg-white p-4 transition-all hover:shadow-lg"
      >
        {/* Image with navigation */}
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg">
          <Link to={`/product/${product.id}`}>
            <img
              src={getImageSrc(currentImageIndex)}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => handleImageError(currentImageIndex)}
            />
          </Link>
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <span className="text-xs font-medium text-muted-foreground">Out of Stock</span>
            </div>
          )}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 w-1 rounded-full ${idx === currentImageIndex ? 'bg-primary' : 'bg-background/60'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link to={`/product/${product.id}`} className="font-semibold line-clamp-1 hover:text-primary">
                {product.title}
              </Link>
              <Badge variant="outline" className={getCategoryColor(product.category)}>
                {product.category}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {product.description || "No description available"}
            </p>
            <Link
              to={`/seller/${product.seller_id}`}
              className="mt-1 inline-block text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Visit Store →
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price, (product.currency || 'USD') as Currency)}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to={`/product/${product.id}`}>
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Link>
              </Button>
              <Button size="sm" disabled={isOutOfStock} onClick={handleAddToCart}>
                <ShoppingCart className="mr-1 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group overflow-hidden rounded-xl border border-border bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
      >
        {/* Image with navigation */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={getImageSrc(currentImageIndex)}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => handleImageError(currentImageIndex)}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <span className="text-sm font-medium text-muted-foreground">Out of Stock</span>
            </div>
          )}
          <Badge
            variant="outline"
            className={`absolute left-3 top-3 ${getCategoryColor(product.category)}`}
          >
            {product.category}
          </Badge>
          
          {/* Image Navigation */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-primary' : 'bg-background/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold line-clamp-1 text-foreground">{product.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {product.description || "No description available"}
          </p>
          <Link
            to={`/seller/${product.seller_id}`}
            className="mt-1 inline-block text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Visit Store →
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price, (product.currency || 'USD') as Currency)}
            </span>
            <Button size="sm" disabled={isOutOfStock} onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
