import { useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getDay } from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import HabitRow from "./HabitRow";
import { cn } from "@/lib/utils";
import { Habit, HabitColor, HABIT_COLORS } from "./HabitTracker";

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
  onSetEndLine: (habitId: string, day: number) => void;
  onSetCompletionValue: (habitId: string, day: number, value: number | null) => void;
  onReorderHabits: (habitIds: string[]) => void;
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
  onSetEndLine,
  onSetCompletionValue,
  onReorderHabits,
}: HabitGridProps) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = habits.findIndex((h) => h.id === active.id);
    const newIndex = habits.findIndex((h) => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...habits.map((h) => h.id)];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, active.id as string);
    onReorderHabits(reordered);
  };

  const activeHabit = activeId ? habits.find((h) => h.id === activeId) : null;

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div
              role="grid"
              aria-label="Habit tracking grid"
              className="rounded-lg border border-border bg-card"
            >
              {/* Header row — standalone grid */}
              <div
                className="grid"
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
              </div>
              {/* Sortable rows — each row is a block-level element with its own grid */}
              <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
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
                    onSetEndLine={(day) => onSetEndLine(habit.id, day)}
                    onSetCompletionValue={(day, value) => onSetCompletionValue(habit.id, day, value)}
                    completionValues={habit.completionValues || {}}
                    endDay={habit.endDay ?? undefined}
                    isLastRow={index === habits.length - 1}
                  />
                ))}
              </SortableContext>
            </div>
            <DragOverlay>
              {activeHabit ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md shadow-lg opacity-90">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      HABIT_COLORS.find((c) => c.value === activeHabit.color)?.bg || "bg-blue-500/20"
                    )}
                  />
                  <span className="text-sm font-medium">{activeHabit.name || "Unnamed habit"}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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
