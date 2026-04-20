import { useState, useCallback } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type HabitColor, HABIT_COLORS } from "./HabitTracker";
import { type Habit } from "./HabitTracker";

export interface SidebarTask {
  id: string;
  name: string;
  habitId: string | null;
  color: string;
}

// Solid dot colors for sidebar task indicators
const DOT_BG: Record<string, string> = {
  gray:    "bg-gray-500",
  red:     "bg-red-500",
  rose:    "bg-rose-300",
  orange:  "bg-orange-500",
  amber:   "bg-amber-600",
  yellow:  "bg-yellow-400",
  lime:    "bg-lime-500",
  green:   "bg-green-500",
  emerald: "bg-emerald-700",
  teal:    "bg-teal-500",
  cyan:    "bg-cyan-500",
  sky:     "bg-sky-300",
  blue:    "bg-blue-500",
  indigo:  "bg-indigo-600",
  purple:  "bg-purple-500",
  fuchsia: "bg-fuchsia-500",
  pink:    "bg-pink-500",
};

interface SidebarTaskItemProps {
  task: SidebarTask;
  onUpdate: (id: string, updates: Partial<SidebarTask>) => void;
  onRemove: (id: string) => void;
}

function SidebarTaskItem({ task, onUpdate, onRemove }: SidebarTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  const commitEdit = () => {
    const trimmed = editName.trim();
    if (trimmed) onUpdate(task.id, { name: trimmed });
    else setEditName(task.name);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 bg-card/50 group",
        isDragging ? "opacity-30" : "cursor-grab active:cursor-grabbing"
      )}
      {...(!isEditing ? { ...listeners, ...attributes } : {})}
    >
      {/* Color dot */}
      <div className={cn("h-3 w-3 rounded-full shrink-0", DOT_BG[task.color] ?? "bg-gray-500")} />

      {/* Name */}
      {isEditing ? (
        <input
          autoFocus
          className="flex-1 bg-transparent text-sm outline-none text-foreground"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") { setEditName(task.name); setIsEditing(false); }
          }}
        />
      ) : (
        <span className="flex-1 text-sm truncate">{task.name}</span>
      )}

      {/* Menu */}
      {!isEditing && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1" side="right" align="start">
            {/* Change color */}
            <div className="flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-muted">
              <span className="text-muted-foreground text-xs">Color</span>
              <ColorPicker
                value={(task.color === "gray" ? "blue" : task.color) as HabitColor}
                onChange={(color) => onUpdate(task.id, { color })}
              />
            </div>
            <button
              className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
              onClick={() => { setEditName(task.name); setIsEditing(true); }}
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
              Edit
            </button>
            <button
              className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted text-destructive"
              onClick={() => onRemove(task.id)}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

interface Props {
  tasks: SidebarTask[];
  habits: Habit[];
  onAddTask: (task: SidebarTask) => void;
  onUpdateTask: (id: string, updates: Partial<SidebarTask>) => void;
  onRemoveTask: (id: string) => void;
}

export default function TimeBlockSidebar({ tasks, habits, onAddTask, onUpdateTask, onRemoveTask }: Props) {
  const [inputName, setInputName] = useState("");
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");

  const addTask = useCallback(() => {
    const name = inputName.trim();
    if (!name && !selectedHabitId) return;

    const habit = habits.find((h) => h.id === selectedHabitId);
    const taskName = name || habit?.name || "";
    if (!taskName) return;

    onAddTask({
      id: crypto.randomUUID(),
      name: taskName,
      habitId: selectedHabitId || null,
      color: habit?.color ?? "gray",
    });
    setInputName("");
    setSelectedHabitId("");
  }, [inputName, selectedHabitId, habits, onAddTask]);

  return (
    <div className="w-52 shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Task input area */}
      <div className="p-3 space-y-2 border-b border-zinc-800">
        <input
          className="w-full bg-muted rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-ring"
          placeholder="Task name"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
        />
        <div className="flex gap-2">
          <select
            className="flex-1 bg-muted rounded-md px-2 py-1.5 text-xs text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
            value={selectedHabitId}
            onChange={(e) => {
              const habit = habits.find((h) => h.id === e.target.value);
              setSelectedHabitId(e.target.value);
              if (habit && !inputName.trim()) setInputName(habit.name);
            }}
          >
            <option value="">No habit</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>{h.name || "Unnamed"}</option>
            ))}
          </select>
          <Button size="icon" className="h-7 w-7 shrink-0" onClick={addTask}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center pt-4 px-2">
            Add a task above, then drag it to the calendar
          </p>
        )}
        {tasks.map((task) => (
          <SidebarTaskItem
            key={task.id}
            task={task}
            onUpdate={onUpdateTask}
            onRemove={onRemoveTask}
          />
        ))}
      </div>
    </div>
  );
}
