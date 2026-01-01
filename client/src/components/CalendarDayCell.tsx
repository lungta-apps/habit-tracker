import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DayHabitList from "./DayHabitList";
import type { Habit, HabitColor } from "./HabitTracker";

interface CalendarDayCellProps {
  day: number | null;
  habits: Habit[];
  onToggleDay: (habitId: string, day: number) => void;
}

// Solid colors for dots (not transparent like cell backgrounds)
const DOT_COLORS: Record<HabitColor, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  teal: "bg-teal-500",
  red: "bg-red-500",
};

const MAX_VISIBLE_DOTS = 6;

export default function CalendarDayCell({ day, habits, onToggleDay }: CalendarDayCellProps) {
  // Empty cell for days before month starts
  if (day === null) {
    return <div className="h-24 bg-muted/20 rounded-md" />;
  }

  // Find habits completed on this day
  const completedHabits = habits.filter((habit) => habit.completedDays.includes(day));
  const visibleDots = completedHabits.slice(0, MAX_VISIBLE_DOTS);
  const overflowCount = completedHabits.length - MAX_VISIBLE_DOTS;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full h-24 p-2 rounded-md border border-border/50",
            "text-left flex flex-col",
            "transition-colors duration-150",
            "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "bg-card/30"
          )}
          aria-label={`${day}, ${completedHabits.length} habits completed`}
        >
          {/* Day number */}
          <span className="text-sm font-medium">{day}</span>

          {/* Completion dots */}
          {completedHabits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {visibleDots.map((habit) => (
                <span
                  key={habit.id}
                  className={cn("w-2.5 h-2.5 rounded-full", DOT_COLORS[habit.color])}
                  aria-hidden="true"
                />
              ))}
              {overflowCount > 0 && (
                <span className="text-xs text-muted-foreground">+{overflowCount}</span>
              )}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <DayHabitList day={day} habits={habits} onToggleDay={onToggleDay} />
      </PopoverContent>
    </Popover>
  );
}
