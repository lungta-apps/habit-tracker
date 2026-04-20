import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { Habit, HabitColor } from "./HabitTracker";

interface DayHabitListProps {
  day: number;
  habits: Habit[];
  onToggleDay: (habitId: string, day: number) => void;
}

// Solid colors for indicator dots
const DOT_COLORS: Record<HabitColor, string> = {
  red:     "bg-red-500",
  rose:    "bg-rose-300",
  orange:  "bg-orange-500",
  amber:   "bg-amber-600",
  yellow:  "bg-yellow-400",
  lime:    "bg-lime-500",
  green:   "bg-green-500",
  emerald: "bg-emerald-700",
  teal:    "bg-teal-500",
  cyan:    "bg-cyan-500",
  sky:     "bg-sky-300",
  blue:    "bg-blue-500",
  indigo:  "bg-indigo-600",
  purple:  "bg-purple-500",
  fuchsia: "bg-fuchsia-500",
  pink:    "bg-pink-500",
};

export default function DayHabitList({ day, habits, onToggleDay }: DayHabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="py-2">
        <h4 className="font-semibold text-sm mb-2">Day {day}</h4>
        <p className="text-sm text-muted-foreground">No habits to track</p>
      </div>
    );
  }

  return (
    <div className="py-1">
      <h4 className="font-semibold text-sm mb-3">Day {day}</h4>
      <div className="space-y-2">
        {habits.map((habit) => {
          const isCompleted = habit.completedDays.includes(day);
          const checkboxId = `habit-${habit.id}-day-${day}`;

          return (
            <div key={habit.id} className="flex items-center gap-2">
              <Checkbox
                id={checkboxId}
                checked={isCompleted}
                onCheckedChange={() => onToggleDay(habit.id, day)}
              />
              <label
                htmlFor={checkboxId}
                className="text-sm cursor-pointer flex items-center gap-2 flex-1"
              >
                <span
                  className={cn("w-2 h-2 rounded-full shrink-0", DOT_COLORS[habit.color])}
                  aria-hidden="true"
                />
                <span className="truncate">{habit.name || "Unnamed habit"}</span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
