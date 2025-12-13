import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactSellerDialog } from "@/components/messaging/ContactSellerDialog";
import { Star, Package, Calendar, Store, MessageCircle } from "lucide-react";
import { sanitizeText } from "@/lib/sanitize";

export default function SellerStorefront() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [contactOpen, setContactOpen] = useState(false);

  // Fetch seller profile
  const { data: seller, isLoading: sellerLoading } = useQuery({
    queryKey: ["seller-profile", sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sellerId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  // Fetch seller products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["seller-products", sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", sellerId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  // Fetch seller reviews (aggregate from all products)
  const { data: reviewStats } = useQuery({
    queryKey: ["seller-reviews", sellerId],
    queryFn: async () => {
      // Get all product IDs for this seller
      const { data: sellerProducts } = await supabase
        .from("products")
        .select("id")
        .eq("seller_id", sellerId);

      if (!sellerProducts || sellerProducts.length === 0) {
        return { avgRating: 0, totalReviews: 0 };
      }

      const productIds = sellerProducts.map((p) => p.id);

      // Get all reviews for seller's products
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("rating")
        .in("product_id", productIds);

      if (error) throw error;

      if (!reviews || reviews.length === 0) {
        return { avgRating: 0, totalReviews: 0 };
      }

      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      return { avgRating, totalReviews: reviews.length };
    },
    enabled: !!sellerId,
  });

  const getInitials = (name: string | null) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const memberSince = seller?.created_at
    ? new Date(seller.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  if (sellerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-16 text-center">
            <Store className="mx-auto h-16 w-16 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-bold">Seller Not Found</h1>
            <p className="mt-2 text-muted-foreground">
              The seller you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-block text-primary hover:underline"
            >
              Browse all products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Seller Header */}
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left md:gap-8">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={seller.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                  {getInitials(seller.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="mt-4 md:mt-0 flex-1">
                <h1 className="text-3xl font-bold text-foreground">
                  {seller.full_name || "Seller Store"}
                </h1>

                {seller.bio && (
                  <p className="mt-2 max-w-2xl text-muted-foreground">
                    {sanitizeText(seller.bio)}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                  {/* Rating */}
                  {reviewStats && reviewStats.totalReviews > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">
                        {reviewStats.avgRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({reviewStats.totalReviews} reviews)
                      </span>
                    </div>
                  )}

                  {/* Products count */}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{products?.length || 0} products</span>
                  </div>

                  {/* Member since */}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {memberSince}</span>
                  </div>
                </div>

                {/* Contact Seller Button */}
                <div className="mt-6">
                  <Button onClick={() => setContactOpen(true)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">All Products</h2>
              <Badge variant="secondary">{products?.length || 0} items</Badge>
            </div>

            {productsLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <Skeleton className="aspect-square w-full" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No products yet</h3>
                <p className="mt-2 text-muted-foreground">
                  This seller hasn't listed any products.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Contact Seller Dialog */}
        <ContactSellerDialog
          open={contactOpen}
          onOpenChange={setContactOpen}
          sellerId={sellerId || ""}
          sellerName={seller?.full_name || "Seller"}
          sellerAvatar={seller?.avatar_url}
        />
      </main>
      <Footer />
    </div>
  );
}
