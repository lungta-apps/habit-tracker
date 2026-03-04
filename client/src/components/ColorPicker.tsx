import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HabitColor, HABIT_COLORS } from "./HabitTracker";

interface ColorPickerProps {
  value: HabitColor;
  onChange: (color: HabitColor) => void;
}

const COLOR_SWATCHES: Record<HabitColor, string> = {
  red:     "bg-red-500",
  rose:    "bg-rose-300",    // pale
  orange:  "bg-orange-500",
  amber:   "bg-amber-600",   // dark gold
  yellow:  "bg-yellow-400",  // bright
  lime:    "bg-lime-500",
  green:   "bg-green-500",
  emerald: "bg-emerald-700", // dark forest
  teal:    "bg-teal-500",
  cyan:    "bg-cyan-500",
  sky:     "bg-sky-300",     // pale
  blue:    "bg-blue-500",
  indigo:  "bg-indigo-600",  // dark
  purple:  "bg-purple-500",
  fuchsia: "bg-fuchsia-500",
  pink:    "bg-pink-500",
};

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          aria-label="Choose habit color"
          data-testid="button-color-picker"
        >
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              COLOR_SWATCHES[value]
            )}
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="start"
        side="bottom"
      >
        <div
          className="grid grid-cols-4 gap-1"
          role="radiogroup"
          aria-label="Color options"
        >
          {HABIT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => onChange(color.value)}
              aria-label={color.label}
              aria-checked={value === color.value}
              role="radio"
              data-testid={`color-option-${color.value}`}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center",
                "transition-all duration-150",
                "hover-elevate active-elevate-2",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                COLOR_SWATCHES[color.value],
                value === color.value && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
