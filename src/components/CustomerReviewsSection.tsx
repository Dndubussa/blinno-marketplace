import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface ReviewWithDetails {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  user: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  product: {
    id: string;
    title: string;
    images: string[] | null;
  } | null;
}

export const CustomerReviewsSection = () => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["top-customer-reviews"],
    queryFn: async () => {
      try {
        // Fetch top-rated reviews (4-5 stars) with content
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("*")
          .gte("rating", 4)
          .not("content", "is", null)
          .order("rating", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(6);

        // Handle 404 or other errors gracefully
        if (reviewsError) {
          if (reviewsError.code === "PGRST116" || reviewsError.message?.includes("404")) {
            return [];
          }
          throw reviewsError;
        }
        if (!reviewsData || reviewsData.length === 0) return [];

      // Get unique user IDs and product IDs
      const userIds = [...new Set(reviewsData.map((r) => r.user_id))];
      const productIds = [...new Set(reviewsData.map((r) => r.product_id))];

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      // Fetch products
      const { data: productsData } = await supabase
        .from("products")
        .select("id, title, images")
        .in("id", productIds);

      // Map reviews with user and product details
      const reviewsWithDetails: ReviewWithDetails[] = reviewsData.map((review) => {
        const user = profilesData?.find((p) => p.id === review.user_id);
        const product = productsData?.find((p) => p.id === review.product_id);

        return {
          id: review.id,
          rating: review.rating,
          title: review.title,
          content: review.content,
          created_at: review.created_at,
          user: user
            ? { full_name: user.full_name, avatar_url: user.avatar_url }
            : null,
          product: product
            ? { id: product.id, title: product.title, images: product.images }
            : null,
        };
      });

        return reviewsWithDetails;
      } catch (error) {
        // Log error but don't throw - return empty array to prevent UI crashes
        console.warn("Error fetching customer reviews:", error);
        return [];
      }
    },
    retry: false, // Don't retry on 404 errors
  });

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-4 h-4 ${
          star <= rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-muted text-muted"
        }`}
      />
    ));
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto bg-muted/30">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          Customer Love
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          What Our Customers Say
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Real reviews from real customers who love shopping with us
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <Card
            key={review.id}
            className="bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="p-6">
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-primary/20 mb-4" />

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                {renderStars(review.rating)}
              </div>

              {/* Review Title */}
              {review.title && (
                <h3 className="font-semibold text-foreground mb-2">
                  {review.title}
                </h3>
              )}

              {/* Review Content */}
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-4">
                {review.content}
              </p>

              {/* Product Link */}
              {review.product && (
                <Link
                  to={`/product/${review.product.id}`}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg mb-4 hover:bg-muted transition-colors"
                >
                  {review.product.images && review.product.images[0] ? (
                    <img
                      src={review.product.images[0]}
                      alt={review.product.title}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground line-clamp-1 flex-1">
                    {review.product.title}
                  </span>
                </Link>
              )}

              {/* User Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.user?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(review.user?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {review.user?.full_name || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(review.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
