import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import HabitNameInput from "./HabitNameInput";
import HabitCell from "./HabitCell";
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
  onSetCompletionValue: (day: number, value: number | null) => void;
  completionValues: Record<number, number>;
  endDay?: number;
  isLastRow?: boolean;
  nameColumnCollapsed?: boolean;
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
}: HabitRowProps) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habitId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="row"
      data-testid={`row-habit-${habitId}`}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${nameColumnCollapsed ? "32px" : "minmax(225px, 250px)"} repeat(${daysInMonth}, minmax(40px, 1fr))`,
        }}
      >
        <HabitNameInput
          value={habitName}
          color={habitColor}
          onChange={onHabitNameChange}
          onColorChange={onHabitColorChange}
          onDelete={onHabitDelete}
          isLastRow={isLastRow}
          dragHandleProps={{ listeners, attributes }}
          nameColumnCollapsed={nameColumnCollapsed}
        />
        {days.map((day) => (
          <HabitCell
            key={day}
            isCompleted={completedDays.includes(day)}
            onToggle={() => onToggleDay(day)}
            onSetEndLine={() => onSetEndLine(day)}
            isEndDay={day === endDay}
            habitName={habitName || "Unnamed habit"}
            dayNumber={day}
            color={habitColor}
            isLastRow={isLastRow}
            numericValue={completionValues[day]}
            onSetValue={(value) => onSetCompletionValue(day, value)}
          />
        ))}
      </div>
    </div>
  );
}
