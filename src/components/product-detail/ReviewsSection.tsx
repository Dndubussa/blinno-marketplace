import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ReviewsSectionProps {
  productId: string;
}

export function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for all review authors
      const userIds = [...new Set(reviewsData.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      // Map profiles to reviews
      return reviewsData.map((review) => ({
        ...review,
        profile: profiles?.find((p) => p.id === review.user_id) || null,
      }));
    },
  });

  const createReview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user!.id,
        rating,
        title: title || null,
        content: content || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      toast.success("Review submitted successfully");
      setShowForm(false);
      setRating(5);
      setTitle("");
      setContent("");
    },
    onError: () => {
      toast.error("Failed to submit review");
    },
  });

  const averageRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews?.filter((r) => r.rating === star).length || 0,
    percentage:
      reviews && reviews.length > 0
        ? ((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
        : 0,
  }));

  return (
    <section className="mt-16">
      <Separator className="mb-8" />
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        {user && !showForm && (
          <Button onClick={() => setShowForm(true)}>Write a Review</Button>
        )}
      </div>

      {/* Rating Summary */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="mt-1 flex justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {reviews?.length || 0} reviews
            </p>
          </div>

          <div className="flex-1 space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-sm">{star}</span>
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm text-muted-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Review Form */}
        {showForm && user && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold">Write Your Review</h3>
            
            <div className="mt-4">
              <label className="text-sm font-medium">Rating</label>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground hover:text-amber-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="title" className="text-sm font-medium">
                Title (optional)
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="mt-2"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="content" className="text-sm font-medium">
                Review (optional)
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts about this product..."
                className="mt-2"
                rows={4}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => createReview.mutate()}
                disabled={createReview.isPending}
              >
                {createReview.isPending ? "Submitting..." : "Submit Review"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="mt-8 space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading reviews...
          </div>
        ) : reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {review.profile?.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {review.profile?.full_name || "Anonymous"}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {review.title && (
                <h4 className="mt-4 font-semibold">{sanitizeText(review.title)}</h4>
              )}
              {review.content && (
                <p className="mt-2 text-muted-foreground">{sanitizeText(review.content)}</p>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">No reviews yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to review this product
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
