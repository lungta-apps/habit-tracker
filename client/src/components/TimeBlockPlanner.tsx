import { useState, useRef, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import TimeBlockSidebar, { type SidebarTask } from "./TimeBlockSidebar";
import TimeBlockCalendar, { HOUR_HEIGHT, type TimeBlock } from "./TimeBlockCalendar";
import { type Habit } from "./HabitTracker";

const SCROLL_ZONE_PX = 80;
const MAX_SCROLL_SPEED = 8;

// API helpers
async function fetchTimeBlocks(date: string): Promise<TimeBlock[]> {
  const res = await fetch(`/api/time-blocks?date=${date}`);
  if (!res.ok) throw new Error("Failed to fetch time blocks");
  return res.json();
}

async function createTimeBlockApi(data: {
  date: string; name: string; habitId?: string | null;
  startMinute: number; durationMinutes: number; color: string;
}): Promise<TimeBlock> {
  const res = await fetch("/api/time-blocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create time block");
  return res.json();
}

async function updateTimeBlockApi(id: string, data: Partial<TimeBlock>): Promise<TimeBlock> {
  const res = await fetch(`/api/time-blocks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update time block");
  return res.json();
}

async function deleteTimeBlockApi(id: string): Promise<void> {
  const res = await fetch(`/api/time-blocks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete time block");
}

interface Props {
  date: string; // "YYYY-MM-DD"
  habits: Habit[];
  onClose: () => void;
}

export default function TimeBlockPlanner({ date, habits, onClose }: Props) {
  const queryClient = useQueryClient();
  const [sidebarTasks, setSidebarTasks] = useState<SidebarTask[]>([]);
  const [activeSidebarTask, setActiveSidebarTask] = useState<SidebarTask | null>(null);
  const [previewMinute, setPreviewMinute] = useState<number | null>(null);
  const previewMinuteRef = useRef<number | null>(null);
  const pointerYRef = useRef(0);
  const calendarGridRef = useRef<HTMLDivElement>(null);
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll state for the sidebar drag
  const autoScrollSpeedRef = useRef(0);
  const autoScrollFrameRef = useRef<number | null>(null);

  // Track global pointer Y during any drag
  useEffect(() => {
    const handler = (e: PointerEvent) => { pointerYRef.current = e.clientY; };
    document.addEventListener("pointermove", handler);
    return () => document.removeEventListener("pointermove", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const { data: timeBlocks = [] } = useQuery({
    queryKey: ["time-blocks", date],
    queryFn: () => fetchTimeBlocks(date),
  });

  const createMutation = useMutation({
    mutationFn: createTimeBlockApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-blocks", date] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeBlock> }) => updateTimeBlockApi(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-blocks", date] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTimeBlockApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-blocks", date] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const getSnappedMinute = useCallback(() => {
    const grid = calendarGridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    if (pointerYRef.current < rect.top || pointerYRef.current > rect.bottom) return null;
    const relY = pointerYRef.current - rect.top;
    return Math.max(0, Math.min(1410, Math.round((relY / HOUR_HEIGHT) * 60 / 15) * 15));
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    autoScrollSpeedRef.current = 0;
  }, []);

  // rAF loop that scrolls the calendar and keeps the preview snap up-to-date
  const startAutoScrollLoop = useCallback(() => {
    if (autoScrollFrameRef.current !== null) return;
    const tick = () => {
      const sc = calendarScrollRef.current;
      if (!sc || autoScrollSpeedRef.current === 0) {
        autoScrollFrameRef.current = null;
        return;
      }
      sc.scrollTop += autoScrollSpeedRef.current;
      // Recalculate preview after scroll since gridRect.top changed
      const snapped = getSnappedMinute();
      if (snapped !== previewMinuteRef.current) {
        previewMinuteRef.current = snapped;
        setPreviewMinute(snapped);
      }
      autoScrollFrameRef.current = requestAnimationFrame(tick);
    };
    autoScrollFrameRef.current = requestAnimationFrame(tick);
  }, [getSnappedMinute]);

  const updateAutoScroll = useCallback((clientY: number) => {
    const sc = calendarScrollRef.current;
    if (!sc) return;
    const { top, bottom } = sc.getBoundingClientRect();
    const fromBottom = bottom - clientY;
    const fromTop = clientY - top;
    let speed = 0;
    if (fromBottom > 0 && fromBottom < SCROLL_ZONE_PX) {
      speed = Math.ceil((1 - fromBottom / SCROLL_ZONE_PX) * MAX_SCROLL_SPEED);
    } else if (fromTop > 0 && fromTop < SCROLL_ZONE_PX) {
      speed = -Math.ceil((1 - fromTop / SCROLL_ZONE_PX) * MAX_SCROLL_SPEED);
    }
    autoScrollSpeedRef.current = speed;
    if (speed !== 0) {
      startAutoScrollLoop();
    } else {
      stopAutoScroll();
    }
  }, [startAutoScrollLoop, stopAutoScroll]);

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      const task = sidebarTasks.find((t) => t.id === active.id);
      if (task) setActiveSidebarTask(task);
    },
    [sidebarTasks]
  );

  const handleDragMove = useCallback(
    (_event: DragMoveEvent) => {
      const snapped = getSnappedMinute();
      if (snapped !== previewMinuteRef.current) {
        previewMinuteRef.current = snapped;
        setPreviewMinute(snapped);
      }
      updateAutoScroll(pointerYRef.current);
    },
    [getSnappedMinute, updateAutoScroll]
  );

  const handleDragEnd = useCallback(
    ({ active }: DragEndEvent) => {
      stopAutoScroll();
      setActiveSidebarTask(null);
      previewMinuteRef.current = null;
      setPreviewMinute(null);

      const snapped = getSnappedMinute();
      if (snapped === null) return; // dropped outside calendar

      const task = sidebarTasks.find((t) => t.id === active.id);
      if (!task) return;

      createMutation.mutate({
        date,
        name: task.name,
        habitId: task.habitId ?? null,
        startMinute: snapped,
        durationMinutes: 60,
        color: task.color,
      });

      setSidebarTasks((prev) => prev.filter((t) => t.id !== task.id));
    },
    [getSnappedMinute, sidebarTasks, createMutation, date, stopAutoScroll]
  );

  const handleAddTask = useCallback((task: SidebarTask) => {
    setSidebarTasks((prev) => [...prev, task]);
  }, []);

  const handleUpdateTask = useCallback((id: string, updates: Partial<SidebarTask>) => {
    setSidebarTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const handleRemoveTask = useCallback((id: string) => {
    setSidebarTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUpdateBlock = useCallback(
    (id: string, data: Partial<TimeBlock>) => {
      updateMutation.mutate({ id, data });
    },
    [updateMutation]
  );

  const handleDeleteBlock = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handleReturnToSidebar = useCallback(
    (block: TimeBlock) => {
      deleteMutation.mutate(block.id);
      setSidebarTasks((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: block.name, habitId: block.habitId, color: block.color },
      ]);
    },
    [deleteMutation]
  );

  const dateLabel = format(parseISO(date), "EEEE, MMMM d, yyyy");

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800 shrink-0">
        <h2 className="text-sm font-semibold">{dateLabel}</h2>
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close planner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <TimeBlockSidebar
            tasks={sidebarTasks}
            habits={habits}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onRemoveTask={handleRemoveTask}
          />
          <TimeBlockCalendar
            blocks={timeBlocks}
            previewMinute={previewMinute}
            calendarGridRef={calendarGridRef}
            scrollContainerRef={calendarScrollRef}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onReturnToSidebar={handleReturnToSidebar}
          />
          <DragOverlay dropAnimation={null}>
            {activeSidebarTask && (
              <div className="px-3 py-2 bg-card border border-border rounded-md shadow-lg text-sm opacity-90 max-w-[180px] truncate">
                {activeSidebarTask.name}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
