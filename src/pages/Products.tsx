import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductSearch } from "@/components/products/ProductSearch";
import { ViewToggle } from "@/components/products/ViewToggle";
import { SortSelect } from "@/components/products/SortSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

export type SortOption = "newest" | "price-low" | "price-high" | "name-asc" | "name-desc";
export type ViewMode = "grid" | "list";

const CATEGORIES = [
  { id: "products", label: "Products" },
  { id: "books", label: "Books & E-Books" },
  { id: "creators", label: "Creators & Artists" },
  { id: "courses", label: "Online Courses" },
  { id: "services", label: "Restaurants & Lodging" },
  { id: "events", label: "Events & Media" },
];

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category));
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered = [...filtered].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategories, sortBy]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        {/* Header */}
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Browse Products
            </h1>
            <p className="mt-2 text-muted-foreground">
              Discover amazing products from sellers around the world
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 shrink-0">
              <ProductFilters
                categories={CATEGORIES}
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
                onClearFilters={clearFilters}
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <ProductSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
                <div className="flex items-center gap-3">
                  <SortSelect value={sortBy} onChange={setSortBy} />
                  <ViewToggle value={viewMode} onChange={setViewMode} />
                </div>
              </div>

              {/* Results count */}
              <p className="mb-4 text-sm text-muted-foreground">
                {isLoading
                  ? "Loading products..."
                  : `${filteredAndSortedProducts.length} product${
                      filteredAndSortedProducts.length !== 1 ? "s" : ""
                    } found`}
              </p>

              {/* Products Grid/List */}
              {isLoading ? (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                      : "space-y-4"
                  }
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4">
                      <Skeleton className="aspect-square w-full rounded-lg" />
                      <Skeleton className="mt-4 h-5 w-3/4" />
                      <Skeleton className="mt-2 h-4 w-1/2" />
                      <Skeleton className="mt-4 h-6 w-1/4" />
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
                  <Package className="h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No products found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                      : "space-y-4"
                  }
                >
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
