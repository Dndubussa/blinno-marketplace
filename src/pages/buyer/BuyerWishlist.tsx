import { useWishlist } from "@/hooks/useWishlist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function BuyerWishlist() {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
        <p className="text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {items && items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
              <Link to={`/product/${product.id}`}>
                <div className="aspect-square bg-muted overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="p-4">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mb-2">
                  {product.category}
                </p>
                <p className="text-lg font-bold text-foreground mb-3">
                  ${product.price.toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() =>
                      addToCart({
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        image: product.image,
                        seller_id: product.seller_id,
                        stock_quantity: product.stock_quantity,
                      })
                    }
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFromWishlist(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-muted-foreground mb-4">
              Save items you love for later
            </p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
