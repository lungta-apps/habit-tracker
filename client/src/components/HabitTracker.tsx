import { useState, useEffect, useCallback } from "react";
import { getDaysInMonth, addMonths, subMonths, format } from "date-fns";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import MonthHeader from "./MonthHeader";
import HabitGrid from "./HabitGrid";

export type HabitColor = "blue" | "green" | "purple" | "pink" | "orange" | "yellow" | "teal" | "red";

export interface Habit {
  id: string;
  name: string;
  completedDays: number[];
  color: HabitColor;
}

export const HABIT_COLORS: { value: HabitColor; label: string; bg: string; text: string }[] = [
  { value: "blue", label: "Blue", bg: "bg-blue-500/20", text: "text-blue-400" },
  { value: "green", label: "Green", bg: "bg-green-500/20", text: "text-green-400" },
  { value: "purple", label: "Purple", bg: "bg-purple-500/20", text: "text-purple-400" },
  { value: "pink", label: "Pink", bg: "bg-pink-500/20", text: "text-pink-400" },
  { value: "orange", label: "Orange", bg: "bg-orange-500/20", text: "text-orange-400" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-500/20", text: "text-yellow-400" },
  { value: "teal", label: "Teal", bg: "bg-teal-500/20", text: "text-teal-400" },
  { value: "red", label: "Red", bg: "bg-red-500/20", text: "text-red-400" },
];

interface MonthData {
  [monthKey: string]: Habit[];
}

const STORAGE_KEY = "habit-tracker-data";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

function loadFromStorage(): MonthData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load habits from storage:", e);
  }
  return {};
}

function saveToStorage(data: MonthData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save habits to storage:", e);
  }
}

export default function HabitTracker() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allData, setAllData] = useState<MonthData>(() => loadFromStorage());
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const monthKey = getMonthKey(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const habits = allData[monthKey] || [];

  useEffect(() => {
    saveToStorage(allData);
  }, [allData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Invalidate the user query to clear the cache
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      // Redirect to login page
      setLocation('/login');
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const updateHabits = useCallback((newHabits: Habit[]) => {
    setAllData((prev) => ({
      ...prev,
      [monthKey]: newHabits,
    }));
  }, [monthKey]);

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => addMonths(prev, 1));
  }, []);

  const handleAddHabit = useCallback(() => {
    const newHabit: Habit = {
      id: generateId(),
      name: "",
      completedDays: [],
      color: "blue",
    };
    updateHabits([...habits, newHabit]);
  }, [habits, updateHabits]);

  const handleUpdateHabit = useCallback(
    (id: string, name: string) => {
      const updated = habits.map((h) =>
        h.id === id ? { ...h, name } : h
      );
      updateHabits(updated);
    },
    [habits, updateHabits]
  );

  const handleUpdateHabitColor = useCallback(
    (id: string, color: HabitColor) => {
      const updated = habits.map((h) =>
        h.id === id ? { ...h, color } : h
      );
      updateHabits(updated);
    },
    [habits, updateHabits]
  );

  const handleDeleteHabit = useCallback(
    (id: string) => {
      const filtered = habits.filter((h) => h.id !== id);
      updateHabits(filtered);
    },
    [habits, updateHabits]
  );

  const handleToggleDay = useCallback(
    (habitId: string, day: number) => {
      const updated = habits.map((h) => {
        if (h.id !== habitId) return h;
        const completedDays = h.completedDays.includes(day)
          ? h.completedDays.filter((d) => d !== day)
          : [...h.completedDays, day];
        return { ...h, completedDays };
      });
      updateHabits(updated);
    },
    [habits, updateHabits]
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MonthHeader
          currentDate={currentDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onLogout={handleLogout}
        />
        <div className="pb-8">
          <HabitGrid
            habits={habits}
            daysInMonth={daysInMonth}
            onAddHabit={handleAddHabit}
            onUpdateHabit={handleUpdateHabit}
            onUpdateHabitColor={handleUpdateHabitColor}
            onDeleteHabit={handleDeleteHabit}
            onToggleDay={handleToggleDay}
          />
        </div>
      </div>
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        data-testid="screen-reader-announcements"
      >
      </div>
    </main>
  );
}
