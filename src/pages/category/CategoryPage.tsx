import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  BookOpen, 
  Users, 
  GraduationCap, 
  UtensilsCrossed, 
  Calendar,
  ChevronLeft,
  Package,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductSearch } from "@/components/products/ProductSearch";
import { SortSelect } from "@/components/products/SortSelect";
import { ViewToggle } from "@/components/products/ViewToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SortOption, ViewMode } from "@/pages/Products";

interface CategoryConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  gradient: string;
  subcategories: string[];
}

const categoryConfigs: Record<string, CategoryConfig> = {
  products: {
    id: "products",
    title: "Products",
    description: "Discover quality physical products from verified sellers",
    icon: ShoppingBag,
    gradient: "from-teal-600 to-cyan-600",
    subcategories: ["Electronics", "Fashion", "Home & Garden", "Sports", "Toys", "Automotive"],
  },
  books: {
    id: "books",
    title: "E-Books & Books",
    description: "Explore our collection of digital and printed books",
    icon: BookOpen,
    gradient: "from-violet-600 to-purple-600",
    subcategories: ["Fiction", "Non-Fiction", "Textbooks", "Self-Help", "Biography", "Children's"],
  },
  creators: {
    id: "creators",
    title: "Creators & Artists",
    description: "Support independent creators and artists",
    icon: Users,
    gradient: "from-pink-600 to-rose-600",
    subcategories: ["Musicians", "Visual Artists", "Photographers", "Writers", "Podcasters", "Influencers"],
  },
  courses: {
    id: "courses",
    title: "Online Courses",
    description: "Learn new skills with expert-led courses",
    icon: GraduationCap,
    gradient: "from-amber-600 to-orange-600",
    subcategories: ["Technology", "Business", "Design", "Marketing", "Languages", "Personal Development"],
  },
  services: {
    id: "services",
    title: "Restaurants & Lodging",
    description: "Find the best dining and accommodation options",
    icon: UtensilsCrossed,
    gradient: "from-blue-600 to-indigo-600",
    subcategories: ["Restaurants", "Hotels", "Vacation Rentals", "Cafes", "Bars", "Resorts"],
  },
  events: {
    id: "events",
    title: "Events & Media",
    description: "Discover events and media content",
    icon: Calendar,
    gradient: "from-emerald-600 to-green-600",
    subcategories: ["Concerts", "Conferences", "Workshops", "Sports Events", "Festivals", "Webinars"],
  },
};

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const config = category ? categoryConfigs[category] : null;
  const Icon = config?.icon || Package;

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", category)
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
    enabled: !!category,
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
          p.description?.toLowerCase().includes(query)
      );
    }

    // Subcategory filter
    if (selectedSubcategory) {
      filtered = filtered.filter((p) => p.subcategory === selectedSubcategory);
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
  }, [products, searchQuery, selectedSubcategory, sortBy]);

  if (!config) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center pt-20">
          <div className="text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h1 className="mt-4 text-2xl font-bold">Category Not Found</h1>
            <Button asChild className="mt-6">
              <Link to="/products">Browse All Products</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className={`relative overflow-hidden bg-gradient-to-r ${config.gradient} py-16`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="container relative mx-auto px-4 lg:px-8">
            <Link
              to="/products"
              className="mb-6 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              All Products
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <Icon className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">{config.title}</h1>
                <p className="mt-2 text-white/80">{config.description}</p>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 lg:px-8">
          {/* Subcategory Filters */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by subcategory</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedSubcategory === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedSubcategory(null)}
              >
                All
              </Badge>
              {config.subcategories.map((sub) => (
                <Badge
                  key={sub}
                  variant={selectedSubcategory === sub ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedSubcategory(sub)}
                >
                  {sub}
                </Badge>
              ))}
            </div>
          </div>

          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ProductSearch value={searchQuery} onChange={setSearchQuery} />
            <div className="flex items-center gap-3">
              <SortSelect value={sortBy} onChange={setSortBy} />
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {/* Results count */}
          <p className="mb-4 text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${filteredAndSortedProducts.length} item${
                  filteredAndSortedProducts.length !== 1 ? "s" : ""
                } found`}
          </p>

          {/* Products Grid/List */}
          {isLoading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-4"
              }
            >
              {Array.from({ length: 8 }).map((_, i) => (
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
              <Icon className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No {config.title.toLowerCase()} found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
      </main>
      <Footer />
    </div>
  );
}
