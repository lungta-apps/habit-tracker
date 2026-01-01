import { startOfMonth, getDay } from "date-fns";
import { Calendar } from "lucide-react";
import CalendarDayCell from "./CalendarDayCell";
import AddHabitDialog from "./AddHabitDialog";
import type { Habit, HabitColor } from "./HabitTracker";

interface CalendarViewProps {
  habits: Habit[];
  currentDate: Date;
  daysInMonth: number;
  onToggleDay: (habitId: string, day: number) => void;
  onAddHabit: (name: string, color: HabitColor) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarView({
  habits,
  currentDate,
  daysInMonth,
  onToggleDay,
  onAddHabit,
}: CalendarViewProps) {
  // Calculate starting offset (Monday = 0, Sunday = 6)
  const firstDayOfMonth = startOfMonth(currentDate);
  const dayOfWeek = getDay(firstDayOfMonth); // 0 = Sunday, 1 = Monday...
  const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Build calendar days array with null placeholders for empty cells
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Empty state
  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-foreground mb-2">No habits yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first habit to start tracking
        </p>
        <AddHabitDialog onAddHabit={onAddHabit} variant="empty-state" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar cells */}
        {calendarDays.map((day, index) => (
          <CalendarDayCell
            key={index}
            day={day}
            habits={habits}
            onToggleDay={onToggleDay}
          />
        ))}
      </div>

      {/* Add habit button */}
      <div className="mt-4">
        <AddHabitDialog onAddHabit={onAddHabit} />
      </div>
    </div>
  );
}
