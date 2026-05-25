import { X, GripVertical } from "lucide-react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import { HabitColor, HABIT_COLORS } from "./HabitTracker";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface DragHandleProps {
  listeners?: SyntheticListenerMap;
  attributes?: Record<string, any>;
}

const WEEKLY_OPTIONS: { label: string; value: number }[] = [
  { label: "1×/wk", value: 1 },
  { label: "2×/wk", value: 2 },
  { label: "3×/wk", value: 3 },
  { label: "4×/wk", value: 4 },
  { label: "5×/wk", value: 5 },
  { label: "6×/wk", value: 6 },
];

interface HabitNameInputProps {
  value: string;
  color: HabitColor;
  onChange: (value: string) => void;
  onColorChange: (color: HabitColor) => void;
  onDelete: () => void;
  placeholder?: string;
  isLastRow?: boolean;
  dragHandleProps?: DragHandleProps;
  nameColumnCollapsed?: boolean;
  weeklyTarget?: number | null;
  onWeeklyTargetChange?: (target: number | null) => void;
}

export default function HabitNameInput({
  value,
  color,
  onChange,
  onColorChange,
  onDelete,
  placeholder = "New habit...",
  isLastRow = false,
  dragHandleProps,
  nameColumnCollapsed = false,
  weeklyTarget,
  onWeeklyTargetChange,
}: HabitNameInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when prop changes (e.g., after refetch)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setLocalValue(value); // Reset to original value
      inputRef.current?.blur();
    }
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Only save if value changed
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  if (nameColumnCollapsed) {
    const colorBg = HABIT_COLORS.find((c) => c.value === color)?.bg ?? "bg-blue-500/20";
    return (
      <div
        className={cn(
          "sticky left-0 z-10 h-10",
          "flex flex-col items-center justify-center gap-0.5",
          "border-r border-border/50",
          !isLastRow && "border-b",
          "bg-card"
        )}
        role="gridcell"
      >
        <div className={cn("w-3 h-3 rounded-full", colorBg)} />
        {weeklyTarget != null && (
          <span className="text-[8px] leading-none text-zinc-400 font-medium">{weeklyTarget}×</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center h-10 px-2 gap-1",
        "sticky left-0 z-10",
        "border-r border-zinc-700",
        !isLastRow && "border-b border-zinc-700",
        "bg-black"
      )}
      role="gridcell"
    >
      {dragHandleProps && (
        <button
          type="button"
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
          aria-label="Drag to reorder"
          {...dragHandleProps.listeners}
          {...dragHandleProps.attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <ColorPicker value={color} onChange={onColorChange} />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label="Habit name"
        data-testid="input-habit-name"
        className={cn(
          "flex-1 bg-transparent text-sm font-medium",
          "placeholder:text-muted-foreground/50",
          "focus:outline-none",
          "min-w-0"
        )}
      />
      {onWeeklyTargetChange && (
        <Popover open={frequencyOpen} onOpenChange={setFrequencyOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Set weekly frequency goal"
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none",
                "transition-opacity duration-150",
                "focus:outline-none focus:ring-1 focus:ring-ring",
                weeklyTarget != null
                  ? "bg-zinc-700 text-zinc-200 opacity-100"
                  : cn("bg-zinc-800 text-zinc-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100")
              )}
            >
              {weeklyTarget != null ? `${weeklyTarget}×/wk` : "···"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1" align="start" side="bottom">
            <div role="listbox" aria-label="Weekly frequency" className="flex flex-col gap-0.5">
              {WEEKLY_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  role="option"
                  aria-selected={weeklyTarget === opt.value}
                  onClick={() => { onWeeklyTargetChange(opt.value); setFrequencyOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded text-sm",
                    "hover:bg-zinc-700 transition-colors",
                    weeklyTarget === opt.value && "bg-zinc-700 font-medium"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label="Delete habit"
        data-testid="button-delete-habit"
        className={cn(
          "h-6 w-6 shrink-0",
          "transition-opacity duration-150",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        )}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
