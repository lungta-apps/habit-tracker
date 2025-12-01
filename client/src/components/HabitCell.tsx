import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { HabitColor, HABIT_COLORS } from "./HabitTracker";

interface HabitCellProps {
  isCompleted: boolean;
  onToggle: () => void;
  habitName: string;
  dayNumber: number;
  color: HabitColor;
  isLastRow?: boolean;
}

function getColorClasses(color: HabitColor) {
  const colorConfig = HABIT_COLORS.find((c) => c.value === color);
  return colorConfig || HABIT_COLORS[0];
}

export default function HabitCell({
  isCompleted,
  onToggle,
  habitName,
  dayNumber,
  color,
  isLastRow = false,
}: HabitCellProps) {
  const colorClasses = getColorClasses(color);

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
        "border-r border-border/50",
        !isLastRow && "border-b",
        "transition-all duration-150 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        "hover-elevate active-elevate-2",
        isCompleted
          ? cn(colorClasses.bg, colorClasses.text)
          : "bg-transparent text-muted-foreground/30 hover:text-muted-foreground/50"
      )}
    >
      {isCompleted && <Check className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
