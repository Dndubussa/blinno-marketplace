import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Clock,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSavedSearches, SavedSearch } from "@/hooks/useSavedSearches";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "electronics", label: "Electronics" },
  { id: "fashion", label: "Fashion" },
  { id: "home", label: "Home & Garden" },
  { id: "books", label: "Books" },
  { id: "sports", label: "Sports" },
  { id: "toys", label: "Toys & Games" },
  { id: "beauty", label: "Beauty" },
  { id: "automotive", label: "Automotive" },
];

const MAX_PRICE = 10000;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { savedSearches, saveSearch, deleteSearch } = useSavedSearches();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("categories")?.split(",").filter(Boolean) || []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("minPrice")) || 0,
    Number(searchParams.get("maxPrice")) || MAX_PRICE,
  ]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["search-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      // Search query filter
      if (query) {
        const searchLower = query.toLowerCase();
        const matchesSearch =
          product.title.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(product.category.toLowerCase())) {
          return false;
        }
      }

      // Price filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false;
      }

      return true;
    });
  }, [products, query, selectedCategories, priceRange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < MAX_PRICE) params.set("maxPrice", priceRange[1].toString());
    setSearchParams(params);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedCategories([]);
    setPriceRange([0, MAX_PRICE]);
    setSearchParams({});
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast.error("Please enter a name for your search");
      return;
    }

    saveSearch({
      name: searchName,
      query,
      filters: {
        categories: selectedCategories,
        priceMin: priceRange[0] > 0 ? priceRange[0] : null,
        priceMax: priceRange[1] < MAX_PRICE ? priceRange[1] : null,
      },
    });

    toast.success("Search saved successfully");
    setSearchName("");
    setSaveDialogOpen(false);
  };

  const applySavedSearch = (saved: SavedSearch) => {
    setQuery(saved.query);
    setSelectedCategories(saved.filters.categories);
    setPriceRange([
      saved.filters.priceMin || 0,
      saved.filters.priceMax || MAX_PRICE,
    ]);
    toast.success(`Applied "${saved.name}" search`);
  };

  const hasActiveFilters =
    query || selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < MAX_PRICE;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Categories</h4>
        <div className="space-y-3">
          {CATEGORIES.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
              />
              <Label
                htmlFor={`cat-${category.id}`}
                className="cursor-pointer text-sm font-normal text-muted-foreground hover:text-foreground"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Price Range</h4>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={MAX_PRICE}
            step={10}
            className="w-full"
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Min</Label>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([Number(e.target.value), priceRange[1]])
                }
                className="mt-1 h-8"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Max</Label>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], Number(e.target.value)])
                }
                className="mt-1 h-8"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Saved Searches */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium">Saved Searches</h4>
          {hasActiveFilters && (
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                  <Bookmark className="h-3 w-3" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Search</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="search-name">Search Name</Label>
                  <Input
                    id="search-name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="e.g., Electronics under $500"
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSearch}>Save Search</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {savedSearches.length === 0 ? (
          <p className="text-xs text-muted-foreground">No saved searches yet</p>
        ) : (
          <div className="space-y-2">
            {savedSearches.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-2"
              >
                <button
                  onClick={() => applySavedSearch(saved)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="h-3 w-3 text-primary" />
                    <span className="text-sm font-medium">{saved.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(saved.createdAt).toLocaleDateString()}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteSearch(saved.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full gap-2"
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container mx-auto px-4 pb-16 pt-24 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Search Products</h1>
          <p className="mt-2 text-muted-foreground">
            Find exactly what you're looking for with advanced filters
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="mb-8"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for products, categories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 pl-12 pr-4 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">
              Search
            </Button>
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 gap-2 lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters Badges */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {query && (
                <Badge variant="secondary" className="gap-1">
                  Query: {query}
                  <button onClick={() => setQuery("")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCategories.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1">
                  {CATEGORIES.find((c) => c.id === cat)?.label}
                  <button onClick={() => handleCategoryToggle(cat)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(priceRange[0] > 0 || priceRange[1] < MAX_PRICE) && (
                <Badge variant="secondary" className="gap-1">
                  ${priceRange[0]} - ${priceRange[1]}
                  <button onClick={() => setPriceRange([0, MAX_PRICE])}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </motion.form>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden w-72 shrink-0 lg:block"
          >
            <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 font-semibold">Filters</h3>
              <FilterContent />
            </div>
          </motion.aside>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4">
                    <Skeleton className="aspect-square w-full rounded-lg bg-muted" />
                    <Skeleton className="mt-4 h-5 w-3/4 bg-muted" />
                    <Skeleton className="mt-2 h-4 w-1/2 bg-muted" />
                    <Skeleton className="mt-4 h-6 w-1/4 bg-muted" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No products found</h3>
                <p className="mb-4 text-muted-foreground">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode="grid"
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
