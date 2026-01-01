import { LayoutList, Calendar } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ViewMode = "grid" | "calendar";

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold">Views</span>
      <ToggleGroup
        type="single"
        value={currentView}
        onValueChange={(value) => {
          if (value) onViewChange(value as ViewMode);
        }}
      >
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <LayoutList className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="calendar" aria-label="Calendar view">
          <Calendar className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
