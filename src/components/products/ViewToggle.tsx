import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ViewMode } from "@/pages/Products";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      className="rounded-lg border border-border bg-card"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view" className="px-3">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" className="px-3">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
