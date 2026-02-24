import { X, GripVertical } from "lucide-react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import { HabitColor, HABIT_COLORS } from "./HabitTracker";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface DragHandleProps {
  listeners?: SyntheticListenerMap;
  attributes?: Record<string, any>;
}

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
}: HabitNameInputProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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
          "flex items-center justify-center",
          "border-r border-border/50",
          !isLastRow && "border-b",
          "bg-card"
        )}
        role="gridcell"
      >
        <div className={cn("w-3 h-3 rounded-full", colorBg)} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center h-10 px-2 gap-1",
        "sticky left-0 z-10",
        "border-r border-border/50",
        !isLastRow && "border-b",
        "bg-card"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label="Delete habit"
        data-testid="button-delete-habit"
        className={cn(
          "h-6 w-6 shrink-0",
          "transition-opacity duration-150",
          isHovered || isFocused ? "opacity-100" : "opacity-0"
        )}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
