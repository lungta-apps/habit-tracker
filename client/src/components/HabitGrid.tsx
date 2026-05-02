import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
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
  onAddHabit: (type: "habit" | "project") => void;
  onUpdateHabit: (id: string, name: string) => void;
  onUpdateHabitColor: (id: string, color: HabitColor) => void;
  onDeleteHabit: (id: string) => void;
  onToggleDay: (habitId: string, day: number) => void;
  onSetEndLine: (habitId: string, day: number) => void;
  onSetCompletionValue: (habitId: string, day: number, value: number | null) => void;
  onReorderHabits: (habitIds: string[]) => void;
  onDayHeaderClick?: (day: number) => void;
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
  onDayHeaderClick,
}: HabitGridProps) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [nameColumnCollapsed, setNameColumnCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem("habit-name-column-collapsed");
    if (stored !== null) return stored === "true";
    return window.innerWidth < 640;
  });

  const toggleNameColumn = () => {
    setNameColumnCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("habit-name-column-collapsed", String(next));
      return next;
    });
  };

  const nameColWidth = nameColumnCollapsed ? "32px" : "minmax(225px, 250px)";
  const gridTemplate = `${nameColWidth} repeat(${daysInMonth}, minmax(40px, 1fr))`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const habitItems = habits.filter((h) => !h.itemType || h.itemType === "habit");
  const projectItems = habits.filter((h) => h.itemType === "project");

  // Get day-of-week letter for a given day number in the current month
  const getDayLetter = (day: number): string => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return DAY_LETTERS[getDay(date)];
  };

  // Drag handlers for habits section
  const handleHabitDragStart = (event: DragStartEvent) => {
    setActiveHabitId(event.active.id as string);
  };

  const handleHabitDragEnd = (event: DragEndEvent) => {
    setActiveHabitId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = habitItems.findIndex((h) => h.id === active.id);
    const newIndex = habitItems.findIndex((h) => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...habitItems.map((h) => h.id)];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, active.id as string);
    onReorderHabits([...reordered, ...projectItems.map((h) => h.id)]);
  };

  // Drag handlers for projects section
  const handleProjectDragStart = (event: DragStartEvent) => {
    setActiveProjectId(event.active.id as string);
  };

  const handleProjectDragEnd = (event: DragEndEvent) => {
    setActiveProjectId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projectItems.findIndex((h) => h.id === active.id);
    const newIndex = projectItems.findIndex((h) => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...projectItems.map((h) => h.id)];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, active.id as string);
    onReorderHabits([...habitItems.map((h) => h.id), ...reordered]);
  };

  const activeHabit = activeHabitId ? habits.find((h) => h.id === activeHabitId) : null;
  const activeProject = activeProjectId ? habits.find((h) => h.id === activeProjectId) : null;

  const dayLettersRow = (
    <div
      className="grid mb-1"
      style={{ gridTemplateColumns: gridTemplate }}
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
  );

  const headerRow = (
    <div
      className="grid"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      <div
        className="sticky left-0 z-10 h-10 flex items-center bg-[#111111] border-r border-b border-zinc-700"
        role="columnheader"
      >
        {!nameColumnCollapsed && (
          <span className="flex-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Name
          </span>
        )}
        <button
          onClick={toggleNameColumn}
          className="h-10 flex items-center justify-center shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          style={{ width: nameColumnCollapsed ? "32px" : "28px" }}
          aria-label={nameColumnCollapsed ? "Expand names" : "Collapse names"}
        >
          {nameColumnCollapsed
            ? <ChevronRight className="h-3 w-3" />
            : <ChevronLeft className="h-3 w-3" />
          }
        </button>
      </div>
      {days.map((day) => (
        <div
          key={day}
          className={cn(
            "h-10 flex items-center justify-center text-xs font-semibold text-muted-foreground bg-[#111111] border-r border-b border-zinc-700 last:border-r-0",
            onDayHeaderClick && "cursor-pointer hover:bg-zinc-800 hover:text-foreground transition-colors"
          )}
          role="columnheader"
          aria-label={`Day ${day}`}
          data-testid={`header-day-${day}`}
          onClick={() => onDayHeaderClick?.(day)}
        >
          {day}
        </div>
      ))}
    </div>
  );

  const renderDragOverlay = (activeItem: Habit | null | undefined) => (
    <DragOverlay>
      {activeItem ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg opacity-90">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              HABIT_COLORS.find((c) => c.value === activeItem.color)?.bg || "bg-blue-500/20"
            )}
          />
          <span className="text-sm font-medium">{activeItem.name || "Unnamed"}</span>
        </div>
      ) : null}
    </DragOverlay>
  );

  return (
    <div className="flex flex-col">

      {/* ===== HABITS SECTION ===== */}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Habits</p>
      <ScrollArea className="w-full pb-3" type="always">
        <div className="pb-3">
          {dayLettersRow}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleHabitDragStart}
            onDragEnd={handleHabitDragEnd}
          >
            <div
              role="grid"
              aria-label="Habit tracking grid"
              className="rounded-lg border border-zinc-700 bg-black"
            >
              {headerRow}
              <SortableContext items={habitItems.map((h) => h.id)} strategy={verticalListSortingStrategy}>
                {habitItems.map((habit, index) => (
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
                    isLastRow={index === habitItems.length - 1}
                    nameColumnCollapsed={nameColumnCollapsed}
                  />
                ))}
              </SortableContext>
            </div>
            {renderDragOverlay(activeHabit)}
          </DndContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <Button
        variant="ghost"
        onClick={() => onAddHabit("habit")}
        className="mt-4 self-start"
        data-testid="button-add-habit"
      >
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        Add habit
      </Button>

      {/* ===== SECTION DIVIDER ===== */}
      <div className="mt-10 mb-8 border-t border-zinc-700" />

      {/* ===== PROJECTS SECTION ===== */}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Projects</p>
      <ScrollArea className="w-full pb-3" type="always">
        <div className="pb-3">
          {dayLettersRow}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleProjectDragStart}
            onDragEnd={handleProjectDragEnd}
          >
            <div
              role="grid"
              aria-label="Project tracking grid"
              className="rounded-lg border border-zinc-700 bg-black"
            >
              {headerRow}
              <SortableContext items={projectItems.map((h) => h.id)} strategy={verticalListSortingStrategy}>
                {projectItems.map((habit, index) => (
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
                    isLastRow={index === projectItems.length - 1}
                    nameColumnCollapsed={nameColumnCollapsed}
                    placeholder="New project..."
                  />
                ))}
              </SortableContext>
            </div>
            {renderDragOverlay(activeProject)}
          </DndContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <Button
        variant="ghost"
        onClick={() => onAddHabit("project")}
        className="mt-4 self-start"
        data-testid="button-add-project"
      >
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        Add project
      </Button>

    </div>
  );
}
