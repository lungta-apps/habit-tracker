import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HabitColor, HABIT_COLORS } from "./HabitTracker";

interface AddHabitDialogProps {
  onAddHabit: (name: string, color: HabitColor) => void;
  variant?: "default" | "empty-state";
}

const COLOR_SWATCHES: Record<HabitColor, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  teal: "bg-teal-500",
  red: "bg-red-500",
};

export default function AddHabitDialog({ onAddHabit, variant = "default" }: AddHabitDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<HabitColor>("blue");

  const handleSubmit = () => {
    onAddHabit(name.trim(), color);
    setName("");
    setColor("blue");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size={variant === "empty-state" ? "default" : "sm"}>
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          {variant === "empty-state" ? "Add your first habit" : "Add habit"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="habit-name" className="text-sm font-medium">
              Habit name
            </label>
            <Input
              id="habit-name"
              placeholder="Enter habit name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div
              className="grid grid-cols-4 gap-1"
              role="radiogroup"
              aria-label="Color options"
            >
              {HABIT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  aria-label={c.label}
                  aria-checked={color === c.value}
                  role="radio"
                  className={cn(
                    "h-7 w-7 rounded-md flex items-center justify-center",
                    "transition-all duration-150",
                    "hover-elevate active-elevate-2",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    COLOR_SWATCHES[c.value],
                    color === c.value && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  )}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full"
          >
            Add habit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
