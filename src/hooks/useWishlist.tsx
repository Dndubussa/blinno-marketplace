import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  image: string | null;
  category: string;
  seller_id: string;
  stock_quantity: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "blinno-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error("Failed to parse wishlist from localStorage:", error);
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToWishlist = (item: WishlistItem) => {
    setItems((prevItems) => {
      const exists = prevItems.some((i) => i.id === item.id);
      if (exists) {
        toast.info(`${item.title} is already in your wishlist`);
        return prevItems;
      }
      toast.success(`Added ${item.title} to wishlist`);
      return [...prevItems, item];
    });
  };

  const removeFromWishlist = (id: string) => {
    setItems((prevItems) => {
      const item = prevItems.find((i) => i.id === id);
      if (item) {
        toast.success(`Removed ${item.title} from wishlist`);
      }
      return prevItems.filter((i) => i.id !== id);
    });
  };

  const isInWishlist = (id: string) => {
    return items.some((item) => item.id === id);
  };

  const clearWishlist = () => {
    setItems([]);
    toast.success("Wishlist cleared");
  };

  const totalItems = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        totalItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
