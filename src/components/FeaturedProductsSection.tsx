import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star, ShoppingCart, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductWithReviews {
  id: string;
  title: string;
  price: number;
  category: string;
  images: string[] | null;
  avgRating: number;
  reviewCount: number;
  latestReview: {
    content: string;
    rating: number;
  } | null;
}

export const FeaturedProductsSection = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["featured-products-with-reviews"],
    queryFn: async () => {
      try {
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(8);

        if (productsError) {
          // Handle 404 or other errors gracefully
          if (productsError.code === "PGRST116" || productsError.message?.includes("404")) {
            return [];
          }
          throw productsError;
        }
        if (!productsData) return [];

        // Fetch reviews for these products
        const productIds = productsData.map((p) => p.id);
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("*")
          .in("product_id", productIds)
          .order("created_at", { ascending: false });

        // Handle reviews error gracefully - continue without reviews if table doesn't exist
        if (reviewsError) {
          if (reviewsError.code === "PGRST116" || reviewsError.message?.includes("404")) {
            // Return products without reviews if reviews table doesn't exist
            return productsData.map((product) => ({
              id: product.id,
              title: product.title,
              price: product.price,
              category: product.category,
              images: product.images,
              avgRating: 0,
              reviewCount: 0,
              latestReview: null,
            }));
          }
          throw reviewsError;
        }

        // Map products with their review stats
        const productsWithReviews: ProductWithReviews[] = productsData.map((product) => {
          const productReviews = reviewsData?.filter((r) => r.product_id === product.id) || [];
          const avgRating =
            productReviews.length > 0
              ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
              : 0;
          const latestReview = productReviews[0]
            ? { content: productReviews[0].content || "", rating: productReviews[0].rating }
            : null;

          return {
            id: product.id,
            title: product.title,
            price: product.price,
            category: product.category,
            images: product.images,
            avgRating,
            reviewCount: productReviews.length,
            latestReview,
          };
        });

        return productsWithReviews;
      } catch (error) {
        // Log error but don't throw - return empty array to prevent UI crashes
        console.warn("Error fetching featured products:", error);
        return [];
      }
    },
    retry: false, // Don't retry on 404 errors
  });

  if (isLoading) {
    return (
      <section className="py-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-3.5 h-3.5 ${
          star <= Math.round(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "fill-muted text-muted"
        }`}
      />
    ));
  };

  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          Top Sellers
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Featured Products
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover our most popular items loved by thousands of customers
        </p>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
            >
              <Link to={`/product/${product.id}`}>
                <Card className="group overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-card h-full">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                        loading="lazy"
                        width={400}
                        height={400}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <img
                          src="/placeholder.svg"
                          alt="No image"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {product.category}
                    </p>
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    
                    {/* Review Stars */}
                    <div className="flex items-center gap-1 mb-2">
                      {renderStars(product.avgRating)}
                      <span className="text-xs text-muted-foreground ml-1">
                        {product.reviewCount > 0
                          ? `(${product.avgRating.toFixed(1)}) · ${product.reviewCount} review${product.reviewCount !== 1 ? "s" : ""}`
                          : "No reviews yet"}
                      </span>
                    </div>

                    {/* Review Highlight */}
                    {product.latestReview && product.latestReview.content && (
                      <div className="bg-muted/50 rounded-md p-2 mb-3">
                        <div className="flex items-start gap-1.5">
                          <Quote className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground line-clamp-2 italic">
                            {product.latestReview.content}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-lg font-bold text-foreground">
                        ${product.price.toFixed(2)}
                      </span>
                      <Button size="sm" variant="outline" className="gap-1">
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 bg-background border-border hover:bg-muted" />
        <CarouselNext className="hidden md:flex -right-4 bg-background border-border hover:bg-muted" />
      </Carousel>

      <div className="text-center mt-10">
        <Button asChild variant="outline" size="lg">
          <Link to="/products">View All Products</Link>
        </Button>
      </div>
    </section>
  );
};
