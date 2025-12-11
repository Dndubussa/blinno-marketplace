import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface Category {
  id: string;
  label: string;
}

interface ProductFiltersProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearFilters: () => void;
}

export function ProductFilters({
  categories,
  selectedCategories,
  onCategoryToggle,
  onClearFilters,
}: ProductFiltersProps) {
  const hasActiveFilters = selectedCategories.length > 0;

  return (
    <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <Separator className="my-4" />

      {/* Categories */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Categories</h4>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => onCategoryToggle(category.id)}
              />
              <Label
                htmlFor={category.id}
                className="cursor-pointer text-sm font-normal text-muted-foreground hover:text-foreground"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <>
          <Separator className="my-4" />
          <div>
            <h4 className="mb-2 text-sm font-medium">Active filters</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((catId) => {
                const category = categories.find((c) => c.id === catId);
                return (
                  <Button
                    key={catId}
                    variant="secondary"
                    size="sm"
                    onClick={() => onCategoryToggle(catId)}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    {category?.label}
                    <X className="h-3 w-3" />
                  </Button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
