import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import HabitRow from "./HabitRow";
import { cn } from "@/lib/utils";

interface Habit {
  id: string;
  name: string;
  completedDays: number[];
}

interface HabitGridProps {
  habits: Habit[];
  daysInMonth: number;
  onAddHabit: () => void;
  onUpdateHabit: (id: string, name: string) => void;
  onDeleteHabit: (id: string) => void;
  onToggleDay: (habitId: string, day: number) => void;
}

export default function HabitGrid({
  habits,
  daysInMonth,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onToggleDay,
}: HabitGridProps) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
      <ScrollArea className="w-full" type="always">
        <div
          role="grid"
          aria-label="Habit tracking grid"
          className={cn(
            "grid rounded-lg border border-border overflow-hidden",
            "bg-card"
          )}
          style={{
            gridTemplateColumns: `minmax(180px, 200px) repeat(${daysInMonth}, minmax(40px, 1fr))`,
          }}
        >
          <div
            className="sticky left-0 z-10 h-10 flex items-center px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 border-r border-b border-border/50"
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

          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habitId={habit.id}
              habitName={habit.name}
              completedDays={habit.completedDays}
              daysInMonth={daysInMonth}
              onHabitNameChange={(name) => onUpdateHabit(habit.id, name)}
              onHabitDelete={() => onDeleteHabit(habit.id)}
              onToggleDay={(day) => onToggleDay(habit.id, day)}
            />
          ))}
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
