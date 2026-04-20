import { useState, useCallback } from "react";
import { getDaysInMonth, addMonths, subMonths, format } from "date-fns";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MonthHeader from "./MonthHeader";
import HabitGrid from "./HabitGrid";
import CalendarView from "./CalendarView";
import ViewSwitcher, { type ViewMode } from "./ViewSwitcher";
import CopyHabitsDialog from "./CopyHabitsDialog";
import TimeBlockPlanner from "./TimeBlockPlanner";
import { useAuth } from "@/hooks/useAuth";

export type HabitColor = "red" | "rose" | "orange" | "amber" | "yellow" | "lime" | "green" | "emerald" | "teal" | "cyan" | "sky" | "blue" | "indigo" | "purple" | "fuchsia" | "pink";

export interface Habit {
  id: string;
  name: string;
  completedDays: number[];
  completionValues?: Record<number, number>;
  color: HabitColor;
  endDay?: number | null;
}

export const HABIT_COLORS: { value: HabitColor; label: string; bg: string; text: string }[] = [
  // Row 1: reds & oranges — vivid paired with contrasting shades
  { value: "red",     label: "Red",     bg: "bg-red-500/20",     text: "text-red-400" },
  { value: "rose",    label: "Rose",    bg: "bg-rose-300/20",    text: "text-rose-400" },    // pale
  { value: "orange",  label: "Orange",  bg: "bg-orange-500/20",  text: "text-orange-400" },
  { value: "amber",   label: "Amber",   bg: "bg-amber-600/20",   text: "text-amber-400" },   // dark gold
  // Row 2: yellows & greens
  { value: "yellow",  label: "Yellow",  bg: "bg-yellow-400/20",  text: "text-yellow-300" },  // bright
  { value: "lime",    label: "Lime",    bg: "bg-lime-500/20",    text: "text-lime-400" },
  { value: "green",   label: "Green",   bg: "bg-green-500/20",   text: "text-green-400" },
  { value: "emerald", label: "Emerald", bg: "bg-emerald-700/20", text: "text-emerald-400" }, // dark forest
  // Row 3: teals & blues
  { value: "teal",    label: "Teal",    bg: "bg-teal-500/20",    text: "text-teal-400" },
  { value: "cyan",    label: "Cyan",    bg: "bg-cyan-500/20",    text: "text-cyan-400" },
  { value: "sky",     label: "Sky",     bg: "bg-sky-300/20",     text: "text-sky-400" },     // pale
  { value: "blue",    label: "Blue",    bg: "bg-blue-500/20",    text: "text-blue-400" },
  // Row 4: purples & pinks
  { value: "indigo",  label: "Indigo",  bg: "bg-indigo-600/20",  text: "text-indigo-400" },  // dark
  { value: "purple",  label: "Purple",  bg: "bg-purple-500/20",  text: "text-purple-400" },
  { value: "fuchsia", label: "Fuchsia", bg: "bg-fuchsia-500/20", text: "text-fuchsia-400" },
  { value: "pink",    label: "Pink",    bg: "bg-pink-500/20",    text: "text-pink-400" },
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

async function createHabit(data: { name: string; color: string; month: string }): Promise<Habit> {
  const response = await fetch("/api/habits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create habit");
  return response.json();
}

async function updateHabit(id: string, data: { name?: string; color?: string; endDay?: number | null }): Promise<Habit> {
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

async function addCompletion(habitId: string, date: string, value?: number): Promise<void> {
  const response = await fetch(`/api/habits/${habitId}/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, value }),
  });
  if (!response.ok) throw new Error("Failed to add completion");
}

async function updateCompletionValue(habitId: string, date: string, value: number | null): Promise<void> {
  const response = await fetch(`/api/habits/${habitId}/completions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, value }),
  });
  if (!response.ok) throw new Error("Failed to update completion value");
}

async function removeCompletion(habitId: string, date: string): Promise<void> {
  const response = await fetch(`/api/habits/${habitId}/completions`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!response.ok) throw new Error("Failed to remove completion");
}

async function reorderHabits(habitIds: string[]): Promise<void> {
  const response = await fetch("/api/habits/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ habitIds }),
  });
  if (!response.ok) throw new Error("Failed to reorder habits");
}

async function copyHabits(data: { habitIds: string[]; targetMonth: string }): Promise<Habit[]> {
  const response = await fetch("/api/habits/copy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to copy habits");
  return response.json();
}

export default function HabitTracker() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewMode>("grid");
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyDialogDismissed, setCopyDialogDismissed] = useState<string | null>(null);
  const [plannerDate, setPlannerDate] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const monthKey = getMonthKey(currentDate);
  const previousMonthKey = getMonthKey(subMonths(currentDate, 1));
  const daysInMonth = getDaysInMonth(currentDate);

  // Fetch habits for current month
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits", monthKey],
    queryFn: () => fetchHabits(monthKey),
  });

  // Fetch previous month's habits (for copy dialog)
  const { data: previousMonthHabits = [] } = useQuery({
    queryKey: ["habits", previousMonthKey],
    queryFn: () => fetchHabits(previousMonthKey),
    enabled: habits.length === 0 && !isLoading, // Only fetch when current month is empty
  });

  // Show copy dialog when navigating to empty month with habits in previous month
  const shouldShowCopyDialog =
    !isLoading &&
    habits.length === 0 &&
    previousMonthHabits.length > 0 &&
    copyDialogDismissed !== monthKey;

  // Mutations
  const createMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", monthKey] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string; endDay?: number | null } }) =>
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

  const setCompletionValueMutation = useMutation({
    mutationFn: async ({ habitId, day, value }: { habitId: string; day: number; value: number | null }) => {
      const dateStr = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), "yyyy-MM-dd");
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const isCompleted = habit.completedDays.includes(day);

      if (value === null && isCompleted) {
        await removeCompletion(habitId, dateStr);
      } else if (value !== null && !isCompleted) {
        await addCompletion(habitId, dateStr, value);
      } else if (value !== null && isCompleted) {
        await updateCompletionValue(habitId, dateStr, value);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", monthKey] });
    },
  });

  const copyMutation = useMutation({
    mutationFn: (habitIds: string[]) => copyHabits({ habitIds, targetMonth: monthKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", monthKey] });
      setShowCopyDialog(false);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderHabits,
    onMutate: (habitIds: string[]) => {
      queryClient.cancelQueries({ queryKey: ["habits", monthKey] });
      const previous = queryClient.getQueryData<Habit[]>(["habits", monthKey]);
      if (previous) {
        const reordered = habitIds
          .map((id) => previous.find((h) => h.id === id))
          .filter(Boolean) as Habit[];
        queryClient.setQueryData(["habits", monthKey], reordered);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["habits", monthKey], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", monthKey] });
    },
  });

  const handleReorderHabits = useCallback(
    (habitIds: string[]) => {
      reorderMutation.mutate(habitIds);
    },
    [reorderMutation]
  );

  const handleCopyHabits = useCallback(
    (habitIds: string[]) => {
      copyMutation.mutate(habitIds);
    },
    [copyMutation]
  );

  const handleDismissCopyDialog = useCallback(() => {
    setCopyDialogDismissed(monthKey);
    setShowCopyDialog(false);
  }, [monthKey]);

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
    createMutation.mutate({ name: "", color: "blue", month: monthKey });
  }, [createMutation, monthKey]);

  const handleAddHabitWithDetails = useCallback(
    (name: string, color: HabitColor) => {
      createMutation.mutate({ name, color, month: monthKey });
    },
    [createMutation, monthKey]
  );

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

  const handleSetEndLine = useCallback(
    (id: string, day: number) => {
      const habit = habits.find((h) => h.id === id);
      if (!habit) return;
      const endDay = habit.endDay === day ? null : day;
      updateMutation.mutate({ id, data: { endDay } });
    },
    [habits, updateMutation]
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

  const handleSetCompletionValue = useCallback(
    (habitId: string, day: number, value: number | null) => {
      setCompletionValueMutation.mutate({ habitId, day, value });
    },
    [setCompletionValueMutation]
  );

  const handleDayHeaderClick = useCallback(
    (day: number) => {
      const dateStr = format(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
        "yyyy-MM-dd"
      );
      setPlannerDate(dateStr);
    },
    [currentDate]
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading habits...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MonthHeader
          currentDate={currentDate}
          username={user?.username}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onLogout={handleLogout}
        />
        <div className="pb-8">
          <div className="mb-4">
            <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
          </div>
          {currentView === "grid" ? (
            <HabitGrid
              habits={habits}
              daysInMonth={daysInMonth}
              currentDate={currentDate}
              onAddHabit={handleAddHabit}
              onUpdateHabit={handleUpdateHabit}
              onUpdateHabitColor={handleUpdateHabitColor}
              onDeleteHabit={handleDeleteHabit}
              onToggleDay={handleToggleDay}
              onSetEndLine={handleSetEndLine}
              onSetCompletionValue={handleSetCompletionValue}
              onReorderHabits={handleReorderHabits}
              onDayHeaderClick={handleDayHeaderClick}
            />
          ) : (
            <CalendarView
              habits={habits}
              currentDate={currentDate}
              daysInMonth={daysInMonth}
              onToggleDay={handleToggleDay}
              onAddHabit={handleAddHabitWithDetails}
            />
          )}
        </div>
      </div>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="screen-reader-announcements"
      >
      </div>
      <CopyHabitsDialog
        open={shouldShowCopyDialog}
        habits={previousMonthHabits}
        sourceMonth={previousMonthKey}
        targetMonth={monthKey}
        onCopy={handleCopyHabits}
        onDismiss={handleDismissCopyDialog}
        isLoading={copyMutation.isPending}
      />
      {plannerDate && (
        <TimeBlockPlanner
          date={plannerDate}
          habits={habits}
          onClose={() => setPlannerDate(null)}
        />
      )}
    </main>
  );
}
