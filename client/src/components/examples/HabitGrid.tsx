import { useState } from "react";
import HabitGrid from "../HabitGrid";

export default function HabitGridExample() {
  const [habits, setHabits] = useState([
    { id: "1", name: "Exercise", completedDays: [1, 3, 5, 7, 9, 11, 13] },
    { id: "2", name: "Read 30 min", completedDays: [1, 2, 3, 4, 5, 8, 9, 10] },
    { id: "3", name: "Meditate", completedDays: [2, 4, 6, 8, 10, 12] },
  ]);

  const handleAddHabit = () => {
    const newHabit = {
      id: String(Date.now()),
      name: "",
      completedDays: [],
    };
    setHabits([...habits, newHabit]);
  };

  const handleUpdateHabit = (id: string, name: string) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, name } : h)));
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
  };

  const handleToggleDay = (habitId: string, day: number) => {
    setHabits(
      habits.map((h) => {
        if (h.id !== habitId) return h;
        const completedDays = h.completedDays.includes(day)
          ? h.completedDays.filter((d) => d !== day)
          : [...h.completedDays, day];
        return { ...h, completedDays };
      })
    );
  };

  return (
    <HabitGrid
      habits={habits}
      daysInMonth={31}
      onAddHabit={handleAddHabit}
      onUpdateHabit={handleUpdateHabit}
      onDeleteHabit={handleDeleteHabit}
      onToggleDay={handleToggleDay}
    />
  );
}
