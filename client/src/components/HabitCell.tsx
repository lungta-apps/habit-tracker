import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCellProps {
  isCompleted: boolean;
  onToggle: () => void;
  habitName: string;
  dayNumber: number;
}

export default function HabitCell({
  isCompleted,
  onToggle,
  habitName,
  dayNumber,
}: HabitCellProps) {
  return (
    <button
      role="gridcell"
      aria-pressed={isCompleted}
      aria-label={`${habitName}, Day ${dayNumber}, ${isCompleted ? "completed" : "not completed"}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      data-testid={`cell-habit-${dayNumber}`}
      className={cn(
        "h-10 w-full min-w-10 flex items-center justify-center",
        "border-r border-b border-border/50",
        "transition-all duration-150 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        "hover-elevate active-elevate-2",
        isCompleted
          ? "bg-primary/20 text-primary"
          : "bg-transparent text-muted-foreground/30 hover:text-muted-foreground/50"
      )}
    >
      {isCompleted && <Check className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
