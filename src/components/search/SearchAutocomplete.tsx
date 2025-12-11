import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { Currency } from "@/lib/currency";

interface Product {
  id: string;
  title: string;
  price: number;
  currency?: string;
  category: string;
  images: string[] | null;
}

const RECENT_SEARCHES_KEY = "blinno-recent-searches";

export function SearchAutocomplete() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch products for suggestions
  const { data: suggestions } = useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select("id, title, price, currency, category, images")
        .eq("is_active", true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      return data as Product[];
    },
    enabled: query.length >= 2,
  });

  const saveRecentSearch = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const removeRecentSearch = (searchTerm: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== searchTerm);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSearch = (searchTerm: string) => {
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm.trim());
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setIsOpen(false);
    setQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const { formatPrice } = useCurrency();

  const trendingSearches = ["Electronics", "Fashion", "Books", "Home Decor"];

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search products, categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="h-12 w-full rounded-lg border-border bg-background pl-12 pr-4 text-base shadow-soft focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </form>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 max-h-[400px] overflow-y-auto rounded-lg border border-border bg-background shadow-lg-custom"
          >
            {/* Product Suggestions */}
            {suggestions && suggestions.length > 0 && (
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                  Products
                </p>
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Search className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{product.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(product.price, (product.currency || 'USD') as Currency)} · {product.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && query.length < 2 && (
              <div className="border-t border-border p-2">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                  Recent Searches
                </p>
                {recentSearches.map((search) => (
                  <div
                    key={search}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                  >
                    <button
                      onClick={() => handleSearch(search)}
                      className="flex flex-1 items-center gap-3"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => removeRecentSearch(search, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Trending Searches */}
            {query.length < 2 && (
              <div className="border-t border-border p-2">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                  Trending
                </p>
                <div className="flex flex-wrap gap-2 px-3 py-2">
                  {trendingSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <TrendingUp className="h-3 w-3 text-primary" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query.length >= 2 && suggestions?.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm">No products found for "{query}"</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleSearch(query)}
                  className="mt-2"
                >
                  Search all results →
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
