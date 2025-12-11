import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  BookOpen,
  Music,
  Video,
  Download,
  Play,
  Library,
  Loader2,
} from "lucide-react";

const DIGITAL_CATEGORIES = ["Books", "Music", "Courses", "Videos"];

export default function DigitalLibrary() {
  const { user } = useAuth();
  const [downloadingProduct, setDownloadingProduct] = useState<string | null>(null);

  const { data: purchasedProducts, isLoading } = useQuery({
    queryKey: ["digital-library", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all purchased product IDs
      const { data: purchases, error: purchaseError } = await supabase
        .from("purchased_products")
        .select("product_id, purchased_at")
        .eq("user_id", user.id);

      if (purchaseError) throw purchaseError;
      if (!purchases || purchases.length === 0) return [];

      const productIds = purchases.map((p) => p.product_id);

      // Get product details for digital products
      const { data: products, error: productError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds)
        .in("category", DIGITAL_CATEGORIES);

      if (productError) throw productError;

      // Merge purchase info with product details
      return products?.map((product) => {
        const purchase = purchases.find((p) => p.product_id === product.id);
        return {
          ...product,
          purchased_at: purchase?.purchased_at,
        };
      }) || [];
    },
    enabled: !!user?.id,
  });

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "books":
        return <BookOpen className="h-5 w-5" />;
      case "music":
        return <Music className="h-5 w-5" />;
      case "courses":
      case "videos":
        return <Video className="h-5 w-5" />;
      default:
        return <Library className="h-5 w-5" />;
    }
  };

  const getFilePath = (product: any): string | null => {
    const attributes = product.attributes as Record<string, any> | null;
    // Extract the file path from the stored URL
    if (attributes?.ebookFile) return extractFilePath(attributes.ebookFile);
    if (attributes?.audiobookFile) return extractFilePath(attributes.audiobookFile);
    if (attributes?.audioFile) return extractFilePath(attributes.audioFile);
    if (attributes?.videoFile) return extractFilePath(attributes.videoFile);
    return null;
  };

  const extractFilePath = (url: string): string | null => {
    // Extract the path after 'product-files/'
    const match = url.match(/product-files\/(.+)$/);
    return match ? match[1] : null;
  };

  const handleSecureDownload = async (product: any) => {
    const filePath = getFilePath(product);
    
    if (!filePath) {
      toast.error("No downloadable file available for this product");
      return;
    }

    setDownloadingProduct(product.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to download files");
        return;
      }

      const { data, error } = await supabase.functions.invoke("get-signed-url", {
        body: { 
          productId: product.id, 
          filePath: filePath 
        },
      });

      if (error) {
        console.error("Error getting signed URL:", error);
        toast.error("Failed to generate download link");
        return;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
        toast.success("Download started");
      } else {
        toast.error("Failed to get download URL");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    } finally {
      setDownloadingProduct(null);
    }
  };

  const groupedProducts = purchasedProducts?.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof purchasedProducts>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Digital Library</h1>
        <p className="text-muted-foreground">
          Access your purchased digital products
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-48 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : purchasedProducts && purchasedProducts.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedProducts || {}).map(([category, products]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getCategoryIcon(category)}
                </div>
                <h2 className="text-lg font-semibold text-foreground">{category}</h2>
                <Badge variant="secondary">{products.length}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product: any) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video relative bg-muted">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getCategoryIcon(product.category)}
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-primary">
                        {product.category}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {product.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Purchased{" "}
                        {new Date(product.purchased_at).toLocaleDateString()}
                      </p>

                      <div className="flex gap-2 mt-4">
                        {getFilePath(product) && (
                          <Button
                            size="sm"
                            onClick={() => handleSecureDownload(product)}
                            disabled={downloadingProduct === product.id}
                            className="flex-1"
                          >
                            {downloadingProduct === product.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Loading...
                              </>
                            ) : ["courses", "videos"].includes(product.category.toLowerCase()) ? (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Watch
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link to={`/products/${product.id}`}>Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Library className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            Your library is empty
          </h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Purchase digital products like books, music, or courses to access them here.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/products">Browse Digital Products</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
