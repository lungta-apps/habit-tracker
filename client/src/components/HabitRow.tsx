import { Fragment } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import HabitNameInput from "./HabitNameInput";
import HabitCell from "./HabitCell";
import { cn } from "@/lib/utils";
import { HabitColor } from "./HabitTracker";

// Outward glow for the weekly progress bar once a week's goal is met.
// Same hues as the time-block glow palette, slightly softer for an outer halo.
const WEEK_GOAL_GLOW: Record<HabitColor, string> = {
  red:     "rgba(239, 68, 68, 0.95)",
  rose:    "rgba(244, 63, 94, 0.95)",
  orange:  "rgba(249, 115, 22, 0.95)",
  amber:   "rgba(245, 158, 11, 0.95)",
  yellow:  "rgba(234, 179, 8, 0.95)",
  lime:    "rgba(132, 204, 22, 0.95)",
  green:   "rgba(34, 197, 94, 0.95)",
  emerald: "rgba(16, 185, 129, 0.95)",
  teal:    "rgba(20, 184, 166, 0.95)",
  cyan:    "rgba(6, 182, 212, 0.95)",
  sky:     "rgba(14, 165, 233, 0.95)",
  blue:    "rgba(59, 130, 246, 0.95)",
  indigo:  "rgba(99, 102, 241, 0.95)",
  purple:  "rgba(168, 85, 247, 0.95)",
  fuchsia: "rgba(217, 70, 239, 0.95)",
  pink:    "rgba(236, 72, 153, 0.95)",
};

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
  carryInCount?: number;
  carryOutCount?: number;
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
  carryInCount = 0,
  carryOutCount = 0,
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
  weekRanges.forEach(([start, end], i) => {
    let count = completedDays.filter((d) => d >= start && d <= end).length;
    // The first/last week may continue into the neighboring month — include those completions
    if (i === 0) count += carryInCount;
    if (i === weekRanges.length - 1) count += carryOutCount;
    for (let d = start; d <= end; d++) dayToWeekCount.set(d, count);
  });

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
                  {weeklyTarget != null && (
                    <div
                      className={cn(
                        "flex flex-col flex-1 transition-shadow duration-300",
                        isWeekGoalMet && "relative z-10"
                      )}
                      style={
                        isWeekGoalMet
                          ? {
                              boxShadow: `0 0 0 1px ${WEEK_GOAL_GLOW[habitColor] ?? WEEK_GOAL_GLOW.blue}, 0 0 6px 2px ${WEEK_GOAL_GLOW[habitColor] ?? WEEK_GOAL_GLOW.blue}, 0 0 16px 5px ${WEEK_GOAL_GLOW[habitColor] ?? WEEK_GOAL_GLOW.blue}`,
                            }
                          : undefined
                      }
                    >
                    {Array.from({ length: weeklyTarget }, (_, i) => {
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
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
