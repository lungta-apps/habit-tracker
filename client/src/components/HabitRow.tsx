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
  isLastRow?: boolean;
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
  isLastRow = false,
}: HabitRowProps) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="contents" role="row" data-testid={`row-habit-${habitId}`}>
      <HabitNameInput
        value={habitName}
        color={habitColor}
        onChange={onHabitNameChange}
        onColorChange={onHabitColorChange}
        onDelete={onHabitDelete}
        isLastRow={isLastRow}
      />
      {days.map((day) => (
        <HabitCell
          key={day}
          isCompleted={completedDays.includes(day)}
          onToggle={() => onToggleDay(day)}
          habitName={habitName || "Unnamed habit"}
          dayNumber={day}
          color={habitColor}
          isLastRow={isLastRow}
        />
      ))}
    </div>
  );
}
