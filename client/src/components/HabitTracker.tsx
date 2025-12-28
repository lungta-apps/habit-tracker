import { useState, useCallback } from "react";
import { getDaysInMonth, addMonths, subMonths, format } from "date-fns";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MonthHeader from "./MonthHeader";
import HabitGrid from "./HabitGrid";
import { useAuth } from "@/hooks/useAuth";

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

function getMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

// API functions
async function fetchHabits(month: string): Promise<Habit[]> {
  const response = await fetch(`/api/habits?month=${month}`);
  if (!response.ok) throw new Error("Failed to fetch habits");
  return response.json();
}

async function createHabit(data: { name: string; color: string }): Promise<Habit> {
  const response = await fetch("/api/habits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create habit");
  return response.json();
}

async function updateHabit(id: string, data: { name?: string; color?: string }): Promise<Habit> {
  const response = await fetch(`/api/habits/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update habit");
  return response.json();
}

async function deleteHabit(id: string): Promise<void> {
  const response = await fetch(`/api/habits/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete habit");
}

async function addCompletion(habitId: string, date: string): Promise<void> {
  const response = await fetch(`/api/habits/${habitId}/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!response.ok) throw new Error("Failed to add completion");
}

async function removeCompletion(habitId: string, date: string): Promise<void> {
  const response = await fetch(`/api/habits/${habitId}/completions`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!response.ok) throw new Error("Failed to remove completion");
}

export default function HabitTracker() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const monthKey = getMonthKey(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);

  // Fetch habits for current month
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits", monthKey],
    queryFn: () => fetchHabits(monthKey),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", monthKey] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      updateHabit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", monthKey] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", monthKey] });
    },
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ habitId, day, isCompleted }: { habitId: string; day: number; isCompleted: boolean }) => {
      // Create date string for the specific day in current month
      const dateStr = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), "yyyy-MM-dd");
      if (isCompleted) {
        await removeCompletion(habitId, dateStr);
      } else {
        await addCompletion(habitId, dateStr);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", monthKey] });
    },
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      queryClient.clear(); // Clear all cached data on logout
      setLocation('/login');
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => addMonths(prev, 1));
  }, []);

  const handleAddHabit = useCallback(() => {
    createMutation.mutate({ name: "", color: "blue" });
  }, [createMutation]);

  const handleUpdateHabit = useCallback(
    (id: string, name: string) => {
      updateMutation.mutate({ id, data: { name } });
    },
    [updateMutation]
  );

  const handleUpdateHabitColor = useCallback(
    (id: string, color: HabitColor) => {
      updateMutation.mutate({ id, data: { color } });
    },
    [updateMutation]
  );

  const handleDeleteHabit = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handleToggleDay = useCallback(
    (habitId: string, day: number) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const isCompleted = habit.completedDays.includes(day);
      toggleCompletionMutation.mutate({ habitId, day, isCompleted });
    },
    [habits, toggleCompletionMutation]
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading habits...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MonthHeader
          currentDate={currentDate}
          username={user?.username}
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
