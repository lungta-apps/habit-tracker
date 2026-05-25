import { Fragment } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import HabitNameInput from "./HabitNameInput";
import HabitCell from "./HabitCell";
import { cn } from "@/lib/utils";
import { HabitColor } from "./HabitTracker";

interface HabitRowProps {
  habitId: string;
  habitName: string;
  habitColor: HabitColor;
  completedDays: number[];
  daysInMonth: number;
  onHabitNameChange: (name: string) => void;
  onHabitColorChange: (color: HabitColor) => void;
  onHabitDelete: () => void;
  onToggleDay: (day: number) => void;
  onSetEndLine: (day: number) => void;
  onSetCompletionValue: (day: number, value: string | null) => void;
  completionValues: Record<number, string>;
  endDay?: number;
  isLastRow?: boolean;
  nameColumnCollapsed?: boolean;
  placeholder?: string;
  weeklyTarget?: number | null;
  onWeeklyTargetChange?: (target: number | null) => void;
  sundayDays: Set<number>;
}

export default function HabitRow({
  habitId,
  habitName,
  habitColor,
  completedDays,
  daysInMonth,
  onHabitNameChange,
  onHabitColorChange,
  onHabitDelete,
  onToggleDay,
  onSetEndLine,
  onSetCompletionValue,
  completionValues,
  endDay,
  isLastRow = false,
  nameColumnCollapsed = false,
  placeholder,
  weeklyTarget,
  onWeeklyTargetChange,
  sundayDays,
}: HabitRowProps) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Build week ranges from Sunday boundaries so we can compute per-week completion counts
  const sortedSundays = Array.from(sundayDays).sort((a, b) => a - b);
  const weekRanges: Array<[number, number]> = [];
  let rangeStart = 1;
  for (const sunday of sortedSundays) {
    weekRanges.push([rangeStart, sunday]);
    rangeStart = sunday + 1;
  }
  if (rangeStart <= daysInMonth) weekRanges.push([rangeStart, daysInMonth]);

  const dayToWeekCount = new Map<number, number>();
  for (const [start, end] of weekRanges) {
    const count = completedDays.filter((d) => d >= start && d <= end).length;
    for (let d = start; d <= end; d++) dayToWeekCount.set(d, count);
  }

  const nameColWidth = nameColumnCollapsed ? "32px" : "minmax(225px, 250px)";
  const gridTemplateColumns = `${nameColWidth} ${days
    .map((day) => `minmax(40px, 1fr)${sundayDays.has(day) ? " 20px" : ""}`)
    .join(" ")}`;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habitId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} role="row" data-testid={`row-habit-${habitId}`}>
      <div className="grid" style={{ gridTemplateColumns }}>
        <HabitNameInput
          value={habitName}
          color={habitColor}
          onChange={onHabitNameChange}
          onColorChange={onHabitColorChange}
          onDelete={onHabitDelete}
          isLastRow={isLastRow}
          dragHandleProps={{ listeners, attributes }}
          nameColumnCollapsed={nameColumnCollapsed}
          placeholder={placeholder}
          weeklyTarget={weeklyTarget}
          onWeeklyTargetChange={onWeeklyTargetChange}
        />
        {days.map((day) => {
          const weekCount = dayToWeekCount.get(day) ?? 0;
          const isWeekGoalMet = weeklyTarget != null && weekCount >= weeklyTarget;
          const isSeparatorDay = sundayDays.has(day);
          return (
            <Fragment key={day}>
              <HabitCell
                isCompleted={completedDays.includes(day)}
                onToggle={() => onToggleDay(day)}
                onSetEndLine={() => onSetEndLine(day)}
                isEndDay={day === endDay}
                habitName={habitName || "Unnamed habit"}
                dayNumber={day}
                color={habitColor}
                isLastRow={isLastRow}
                cellValue={completionValues[day]}
                onSetValue={(value) => onSetCompletionValue(day, value)}
                isWeekGoalMet={isWeekGoalMet}
              />
              {isSeparatorDay && (
                <div
                  className={cn(
                    "flex flex-col h-full",
                    "border-r border-zinc-800",
                    !isLastRow && "border-b border-zinc-700"
                  )}
                  aria-hidden="true"
                >
                  {weeklyTarget != null &&
                    Array.from({ length: weeklyTarget }, (_, i) => {
                      const filled = i >= weeklyTarget - Math.min(weekCount, weeklyTarget);
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex-1",
                            i < weeklyTarget - 1 && "border-b border-zinc-800",
                            filled ? "bg-white/80" : "bg-zinc-900"
                          )}
                        />
                      );
                    })}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
