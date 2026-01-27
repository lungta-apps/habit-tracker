import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type Habit, HABIT_COLORS } from "./HabitTracker";

interface CopyHabitsDialogProps {
  open: boolean;
  habits: Habit[];
  sourceMonth: string;
  targetMonth: string;
  onCopy: (habitIds: string[]) => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

function formatMonth(monthKey: string): string {
  return format(parseISO(`${monthKey}-01`), "MMMM yyyy");
}

export default function CopyHabitsDialog({
  open,
  habits,
  sourceMonth,
  targetMonth,
  onCopy,
  onDismiss,
  isLoading = false,
}: CopyHabitsDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pre-select all habits when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(habits.map((h) => h.id)));
    }
  }, [open, habits]);

  const handleToggle = (habitId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(habitId)) {
        next.delete(habitId);
      } else {
        next.add(habitId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(habits.map((h) => h.id)));
  };

  const handleSelectNone = () => {
    setSelectedIds(new Set());
  };

  const handleCopy = () => {
    onCopy(Array.from(selectedIds));
  };

  const getColorClasses = (color: string) => {
    const colorConfig = HABIT_COLORS.find((c) => c.value === color);
    return colorConfig ? `${colorConfig.bg} ${colorConfig.text}` : "bg-muted text-muted-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy habits to {formatMonth(targetMonth)}</DialogTitle>
          <DialogDescription>
            Select which habits from {formatMonth(sourceMonth)} you'd like to continue tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} of {habits.length} selected
            </span>
            <div className="space-x-2">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSelectNone}>
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {habits.map((habit) => (
              <label
                key={habit.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                  "border border-border hover:bg-accent/50 transition-colors",
                  selectedIds.has(habit.id) && "bg-accent/30"
                )}
              >
                <Checkbox
                  checked={selectedIds.has(habit.id)}
                  onCheckedChange={() => handleToggle(habit.id)}
                />
                <div
                  className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0",
                    getColorClasses(habit.color).split(" ")[0].replace("/20", "")
                  )}
                  style={{
                    backgroundColor: `var(--${habit.color}-500, currentColor)`,
                  }}
                />
                <span className="flex-1 truncate">{habit.name || "Unnamed habit"}</span>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onDismiss} className="sm:flex-1">
            Start fresh
          </Button>
          <Button
            onClick={handleCopy}
            disabled={selectedIds.size === 0 || isLoading}
            className="sm:flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            {isLoading ? "Copying..." : `Copy ${selectedIds.size} habit${selectedIds.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
