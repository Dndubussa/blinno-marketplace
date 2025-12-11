import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Share2, Minus, Plus, Check, Download, Lock, FileText, FileAudio, FileVideo, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { usePurchasedProducts } from "@/hooks/usePurchasedProducts";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { Currency } from "@/lib/currency";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency?: string;
  category: string;
  subcategory: string | null;
  stock_quantity: number;
  images?: string[] | null;
  seller_id: string;
  attributes?: any;
}

interface ProductInfoProps {
  product: Product;
}

// Digital categories that require purchase for content access
const DIGITAL_CATEGORIES = ["Books", "Music", "Courses"];

const isDigitalProduct = (category: string) => DIGITAL_CATEGORIES.includes(category);

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

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { hasPurchased } = usePurchasedProducts();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  
  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const isWishlisted = isInWishlist(product.id);
  const isDigital = isDigitalProduct(product.category);
  const isPurchased = hasPurchased(product.id);
  const attributes = product.attributes || {};

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || null,
        stock_quantity: product.stock_quantity,
        seller_id: product.seller_id,
      },
      quantity
    );
  };

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || null,
        category: product.category,
        seller_id: product.seller_id,
        stock_quantity: product.stock_quantity,
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="flex flex-col">
      {/* Category */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={getCategoryColor(product.category)}>
          {product.category}
        </Badge>
        {product.subcategory && (
          <Badge variant="secondary">{product.subcategory}</Badge>
        )}
      </div>

      {/* Title */}
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {product.title}
      </h1>

      {/* Seller Link */}
      <Link
        to={`/seller/${product.seller_id}`}
        className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <Store className="h-4 w-4" />
        Visit Seller Store
      </Link>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-primary">
          {formatPrice(product.price, (product.currency || 'USD') as Currency)}
        </span>
      </div>

      {/* Stock Status */}
      <div className="mt-4">
        {isOutOfStock ? (
          <span className="text-sm font-medium text-destructive">Out of Stock</span>
        ) : isLowStock ? (
          <span className="text-sm font-medium text-amber-500">
            Only {product.stock_quantity} left in stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-500">
            <Check className="h-4 w-4" />
            In Stock
          </span>
        )}
      </div>

      <Separator className="my-6" />

      {/* Description */}
      <div>
        <h3 className="font-semibold">Description</h3>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          {product.description || "No description available for this product."}
        </p>
      </div>

      <Separator className="my-6" />

      {/* Digital Content Access Section */}
      {isDigital && (
        <>
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              {isPurchased ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  Digital Content Access
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  Digital Content (Purchase Required)
                </>
              )}
            </h3>
            
            {isPurchased ? (
              <div className="mt-3 space-y-2">
                {attributes.ebookFile && (
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <a href={attributes.ebookFile} target="_blank" rel="noopener noreferrer" download>
                      <FileText className="mr-2 h-4 w-4" />
                      Download E-Book
                    </a>
                  </Button>
                )}
                {attributes.audiobookFile && (
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <a href={attributes.audiobookFile} target="_blank" rel="noopener noreferrer" download>
                      <FileAudio className="mr-2 h-4 w-4" />
                      Download Audiobook
                    </a>
                  </Button>
                )}
                {attributes.audioFile && (
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <a href={attributes.audioFile} target="_blank" rel="noopener noreferrer" download>
                      <FileAudio className="mr-2 h-4 w-4" />
                      Download Audio
                    </a>
                  </Button>
                )}
                {attributes.courseVideos && (
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <a href={attributes.courseVideos} target="_blank" rel="noopener noreferrer">
                      <FileVideo className="mr-2 h-4 w-4" />
                      Access Course Content
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Purchase this {product.category.toLowerCase()} to access the digital content.
                {!user && " Sign in to buy."}
              </p>
            )}
          </div>
          <Separator className="my-6" />
        </>
      )}

      {/* Quantity Selector - Only for physical products */}
      {!isDigital && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Quantity:</span>
          <div className="flex items-center gap-2 rounded-lg border border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-r-none"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-l-none"
              onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
              disabled={quantity >= product.stock_quantity}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {isDigital && !isPurchased ? "Buy Now" : "Add to Cart"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleWishlist}
          className={isWishlisted ? "text-destructive border-destructive" : ""}
        >
          <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
        </Button>
        <Button variant="outline" size="lg" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
