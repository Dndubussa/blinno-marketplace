import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    categories: string[];
    priceMin: number | null;
    priceMax: number | null;
  };
  createdAt: string;
}

interface SavedSearchesContextType {
  savedSearches: SavedSearch[];
  saveSearch: (search: Omit<SavedSearch, "id" | "createdAt">) => void;
  deleteSearch: (id: string) => void;
}

const SavedSearchesContext = createContext<SavedSearchesContextType | undefined>(undefined);

const STORAGE_KEY = "blinno-saved-searches";

export function SavedSearchesProvider({ children }: { children: ReactNode }) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedSearches(JSON.parse(stored));
      } catch {
        setSavedSearches([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSearches));
  }, [savedSearches]);

  const saveSearch = (search: Omit<SavedSearch, "id" | "createdAt">) => {
    const newSearch: SavedSearch = {
      ...search,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setSavedSearches((prev) => [newSearch, ...prev].slice(0, 10)); // Max 10 saved searches
  };

  const deleteSearch = (id: string) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <SavedSearchesContext.Provider value={{ savedSearches, saveSearch, deleteSearch }}>
      {children}
    </SavedSearchesContext.Provider>
  );
}

export function useSavedSearches() {
  const context = useContext(SavedSearchesContext);
  if (!context) {
    throw new Error("useSavedSearches must be used within a SavedSearchesProvider");
  }
  return context;
}
