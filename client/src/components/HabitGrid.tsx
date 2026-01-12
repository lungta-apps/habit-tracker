import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getDay } from "date-fns";
import HabitRow from "./HabitRow";
import { cn } from "@/lib/utils";
import { Habit, HabitColor } from "./HabitTracker";

// Day of week letters: Sunday=0 through Saturday=6
const DAY_LETTERS = ["S", "M", "T", "W", "R", "F", "S"];

interface HabitGridProps {
  habits: Habit[];
  daysInMonth: number;
  currentDate: Date;
  onAddHabit: () => void;
  onUpdateHabit: (id: string, name: string) => void;
  onUpdateHabitColor: (id: string, color: HabitColor) => void;
  onDeleteHabit: (id: string) => void;
  onToggleDay: (habitId: string, day: number) => void;
}

export default function HabitGrid({
  habits,
  daysInMonth,
  currentDate,
  onAddHabit,
  onUpdateHabit,
  onUpdateHabitColor,
  onDeleteHabit,
  onToggleDay,
}: HabitGridProps) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Get day-of-week letter for a given day number in the current month
  const getDayLetter = (day: number): string => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return DAY_LETTERS[getDay(date)];
  };

  if (habits.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        role="region"
        aria-label="Empty habit tracker"
      >
        <Calendar className="h-12 w-12 mb-4 opacity-50" aria-hidden="true" />
        <p className="text-lg mb-4" data-testid="text-empty-state">
          Click any cell to track a habit
        </p>
        <Button 
          onClick={onAddHabit} 
          variant="outline"
          data-testid="button-add-first-habit"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add your first habit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ScrollArea className="w-full pb-3" type="always">
        <div className="pb-3">
          {/* Day-of-week letters row - above the grid */}
          <div
            className="grid mb-1"
            style={{
              gridTemplateColumns: `minmax(225px, 250px) repeat(${daysInMonth}, minmax(40px, 1fr))`,
            }}
            aria-hidden="true"
          >
            <div className="sticky left-0 z-10" />
            {days.map((day) => (
              <div
                key={day}
                className="flex items-center justify-center text-[10px] text-muted-foreground/60"
              >
                {getDayLetter(day)}
              </div>
            ))}
          </div>
          <div
              role="grid"
              aria-label="Habit tracking grid"
              className="grid rounded-lg border border-border bg-card"
              style={{
                gridTemplateColumns: `minmax(225px, 250px) repeat(${daysInMonth}, minmax(40px, 1fr))`,
              }}
            >
              <div
                className="sticky left-0 z-10 h-10 flex items-center px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted border-r border-b border-border/50"
                role="columnheader"
              >
                Habit
              </div>
              {days.map((day) => (
                <div
                  key={day}
                  className="h-10 flex items-center justify-center text-xs font-semibold text-muted-foreground bg-muted/50 border-r border-b border-border/50 last:border-r-0"
                  role="columnheader"
                  aria-label={`Day ${day}`}
                  data-testid={`header-day-${day}`}
                >
                  {day}
                </div>
              ))}
              {habits.map((habit, index) => (
                <HabitRow
                  key={habit.id}
                  habitId={habit.id}
                  habitName={habit.name}
                  habitColor={habit.color || "blue"}
                  completedDays={habit.completedDays}
                  daysInMonth={daysInMonth}
                  onHabitNameChange={(name) => onUpdateHabit(habit.id, name)}
                  onHabitColorChange={(color) => onUpdateHabitColor(habit.id, color)}
                  onHabitDelete={() => onDeleteHabit(habit.id)}
                  onToggleDay={(day) => onToggleDay(habit.id, day)}
                  isLastRow={index === habits.length - 1}
                />
              ))}
            </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Button
        variant="ghost"
        onClick={onAddHabit}
        className="mt-4 self-start"
        data-testid="button-add-habit"
      >
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        Add habit
      </Button>
    </div>
  );
}
