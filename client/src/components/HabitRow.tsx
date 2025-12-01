import HabitNameInput from "./HabitNameInput";
import HabitCell from "./HabitCell";

interface HabitRowProps {
  habitId: string;
  habitName: string;
  completedDays: number[];
  daysInMonth: number;
  onHabitNameChange: (name: string) => void;
  onHabitDelete: () => void;
  onToggleDay: (day: number) => void;
}

export default function HabitRow({
  habitId,
  habitName,
  completedDays,
  daysInMonth,
  onHabitNameChange,
  onHabitDelete,
  onToggleDay,
}: HabitRowProps) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="contents" role="row" data-testid={`row-habit-${habitId}`}>
      <HabitNameInput
        value={habitName}
        onChange={onHabitNameChange}
        onDelete={onHabitDelete}
      />
      {days.map((day) => (
        <HabitCell
          key={day}
          isCompleted={completedDays.includes(day)}
          onToggle={() => onToggleDay(day)}
          habitName={habitName || "Unnamed habit"}
          dayNumber={day}
        />
      ))}
    </div>
  );
}
