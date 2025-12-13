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
  
  // Digital products don't have stock quantity
  const hasStock = product.stock_quantity !== null;
  const isOutOfStock = hasStock && product.stock_quantity === 0;
  const isLowStock = hasStock && product.stock_quantity > 0 && product.stock_quantity <= 5;
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

      {/* Category-Specific Attributes */}
      {Object.keys(attributes).length > 0 && (
        <>
          <div>
            <h3 className="font-semibold mb-4">Product Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Music Attributes */}
              {product.category === "Music" && (
                <>
                  {attributes.artist && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Artist/Band</span>
                      <p className="mt-1 text-sm">{attributes.artist}</p>
                    </div>
                  )}
                  {attributes.genre && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Genre</span>
                      <p className="mt-1 text-sm capitalize">{attributes.genre.replace(/([A-Z])/g, ' $1').trim()}</p>
                    </div>
                  )}
                  {attributes.musicType && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Type</span>
                      <p className="mt-1 text-sm capitalize">{attributes.musicType}</p>
                    </div>
                  )}
                  {attributes.duration && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Duration</span>
                      <p className="mt-1 text-sm">{attributes.duration}</p>
                    </div>
                  )}
                  {attributes.releaseDate && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Release Date</span>
                      <p className="mt-1 text-sm">{new Date(attributes.releaseDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {attributes.recordLabel && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Record Label</span>
                      <p className="mt-1 text-sm">{attributes.recordLabel}</p>
                    </div>
                  )}
                  {attributes.trackListing && (
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Track Listing</span>
                      <div className="mt-1 text-sm whitespace-pre-line bg-muted/30 p-3 rounded-lg">
                        {attributes.trackListing}
                      </div>
                    </div>
                  )}
                  {attributes.videoFile && (
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Music Video</span>
                      <div className="mt-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={attributes.videoFile} target="_blank" rel="noopener noreferrer">
                            <FileVideo className="mr-2 h-4 w-4" />
                            Watch Music Video
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Books Attributes */}
              {product.category === "Books" && (
                <>
                  {attributes.author && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Author</span>
                      <p className="mt-1 text-sm">{attributes.author}</p>
                    </div>
                  )}
                  {attributes.isbn && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">ISBN</span>
                      <p className="mt-1 text-sm">{attributes.isbn}</p>
                    </div>
                  )}
                  {attributes.format && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Format</span>
                      <p className="mt-1 text-sm capitalize">{attributes.format.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {attributes.pages && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Pages</span>
                      <p className="mt-1 text-sm">{attributes.pages}</p>
                    </div>
                  )}
                  {attributes.publisher && (
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Publisher</span>
                      <p className="mt-1 text-sm">{attributes.publisher}</p>
                    </div>
                  )}
                </>
              )}

              {/* Courses Attributes */}
              {product.category === "Courses" && (
                <>
                  {attributes.instructor && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Instructor</span>
                      <p className="mt-1 text-sm">{attributes.instructor}</p>
                    </div>
                  )}
                  {attributes.skillLevel && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Skill Level</span>
                      <p className="mt-1 text-sm capitalize">{attributes.skillLevel}</p>
                    </div>
                  )}
                  {attributes.courseDuration && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Duration</span>
                      <p className="mt-1 text-sm">{attributes.courseDuration} hours</p>
                    </div>
                  )}
                  {attributes.lessonsCount && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Lessons</span>
                      <p className="mt-1 text-sm">{attributes.lessonsCount} lessons</p>
                    </div>
                  )}
                  {attributes.learningOutcomes && (
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">What You'll Learn</span>
                      <div className="mt-1 text-sm whitespace-pre-line bg-muted/30 p-3 rounded-lg">
                        {attributes.learningOutcomes}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Clothes Attributes */}
              {product.category === "Clothes" && (
                <>
                  {attributes.sizes && Array.isArray(attributes.sizes) && attributes.sizes.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Sizes Available</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {attributes.sizes.map((size: string) => (
                          <Badge key={size} variant="secondary" className="text-xs">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {attributes.colors && Array.isArray(attributes.colors) && attributes.colors.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Colors Available</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {attributes.colors.map((color: string) => (
                          <Badge key={color} variant="secondary" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {attributes.material && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Material</span>
                      <p className="mt-1 text-sm">{attributes.material}</p>
                    </div>
                  )}
                  {attributes.gender && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Gender</span>
                      <p className="mt-1 text-sm capitalize">{attributes.gender}</p>
                    </div>
                  )}
                </>
              )}

              {/* Electronics Attributes */}
              {product.category === "Electronics" && (
                <>
                  {attributes.brand && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Brand</span>
                      <p className="mt-1 text-sm">{attributes.brand}</p>
                    </div>
                  )}
                  {attributes.model && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Model</span>
                      <p className="mt-1 text-sm">{attributes.model}</p>
                    </div>
                  )}
                  {attributes.warranty && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Warranty</span>
                      <p className="mt-1 text-sm">{attributes.warranty} months</p>
                    </div>
                  )}
                  {attributes.condition && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Condition</span>
                      <p className="mt-1 text-sm capitalize">{attributes.condition}</p>
                    </div>
                  )}
                  {attributes.specifications && (
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Technical Specifications</span>
                      <div className="mt-1 text-sm whitespace-pre-line bg-muted/30 p-3 rounded-lg">
                        {attributes.specifications}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Perfumes Attributes */}
              {product.category === "Perfumes" && (
                <>
                  {attributes.volume && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Volume</span>
                      <p className="mt-1 text-sm">{attributes.volume} ml</p>
                    </div>
                  )}
                  {attributes.concentration && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Concentration</span>
                      <p className="mt-1 text-sm capitalize">{attributes.concentration.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {attributes.fragranceGender && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Target Gender</span>
                      <p className="mt-1 text-sm capitalize">{attributes.fragranceGender}</p>
                    </div>
                  )}
                  {attributes.scentFamily && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Scent Family</span>
                      <p className="mt-1 text-sm capitalize">{attributes.scentFamily}</p>
                    </div>
                  )}
                  {attributes.fragranceNotes && (
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Fragrance Notes</span>
                      <div className="mt-1 text-sm whitespace-pre-line bg-muted/30 p-3 rounded-lg">
                        {attributes.fragranceNotes}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Art & Crafts Attributes */}
              {product.category === "Art & Crafts" && (
                <>
                  {attributes.medium && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Medium</span>
                      <p className="mt-1 text-sm capitalize">{attributes.medium.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {attributes.style && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Style</span>
                      <p className="mt-1 text-sm">{attributes.style}</p>
                    </div>
                  )}
                  {(attributes.width || attributes.height || attributes.depth) && (
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Dimensions</span>
                      <p className="mt-1 text-sm">
                        {attributes.width && `${attributes.width} cm`}
                        {attributes.width && attributes.height && ' × '}
                        {attributes.height && `${attributes.height} cm`}
                        {attributes.depth && ` × ${attributes.depth} cm`}
                      </p>
                    </div>
                  )}
                  {attributes.artType && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Type</span>
                      <p className="mt-1 text-sm capitalize">{attributes.artType.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                </>
              )}

              {/* Home Appliances & Kitchenware Attributes */}
              {(product.category === "Home Appliances" || product.category === "Kitchenware") && (
                <>
                  {attributes.brand && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Brand</span>
                      <p className="mt-1 text-sm">{attributes.brand}</p>
                    </div>
                  )}
                  {attributes.modelNumber && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Model Number</span>
                      <p className="mt-1 text-sm">{attributes.modelNumber}</p>
                    </div>
                  )}
                  {attributes.warranty && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Warranty</span>
                      <p className="mt-1 text-sm">{attributes.warranty} months</p>
                    </div>
                  )}
                  {attributes.power && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Power</span>
                      <p className="mt-1 text-sm">{attributes.power} Watts</p>
                    </div>
                  )}
                  {attributes.dimensions && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Dimensions</span>
                      <p className="mt-1 text-sm">{attributes.dimensions}</p>
                    </div>
                  )}
                  {attributes.features && (
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Key Features</span>
                      <div className="mt-1 text-sm whitespace-pre-line bg-muted/30 p-3 rounded-lg">
                        {attributes.features}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Other Category Attributes */}
              {product.category === "Other" && (
                <>
                  {attributes.brand && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Brand/Manufacturer</span>
                      <p className="mt-1 text-sm">{attributes.brand}</p>
                    </div>
                  )}
                  {attributes.modelNumber && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Model/Item Number</span>
                      <p className="mt-1 text-sm">{attributes.modelNumber}</p>
                    </div>
                  )}
                  {attributes.condition && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Condition</span>
                      <p className="mt-1 text-sm capitalize">{attributes.condition.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {attributes.warranty && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Warranty</span>
                      <p className="mt-1 text-sm">{attributes.warranty}</p>
                    </div>
                  )}
                  {attributes.specifications && (
                    <div className="sm:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Additional Specifications</span>
                      <div className="mt-1 text-sm whitespace-pre-line bg-muted/30 p-3 rounded-lg">
                        {attributes.specifications}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <Separator className="my-6" />
        </>
      )}

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
