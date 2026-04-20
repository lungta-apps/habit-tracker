import { useRef, useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { HabitColor, HABIT_COLORS } from "./HabitTracker";

interface HabitCellProps {
  isCompleted: boolean;
  onToggle: () => void;
  onSetEndLine: () => void;
  isEndDay?: boolean;
  habitName: string;
  dayNumber: number;
  color: HabitColor;
  isLastRow?: boolean;
  numericValue?: number;
  onSetValue: (value: number | null) => void;
}

function getColorClasses(color: HabitColor) {
  const colorConfig = HABIT_COLORS.find((c) => c.value === color);
  return colorConfig || HABIT_COLORS[0];
}

export default function HabitCell({
  isCompleted,
  onToggle,
  onSetEndLine,
  isEndDay = false,
  habitName,
  dayNumber,
  color,
  isLastRow = false,
  numericValue,
  onSetValue,
}: HabitCellProps) {
  const colorClasses = getColorClasses(color);
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didLongPress = useRef(false);

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (isEditing) return;
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      return;
    }
    clickTimeout.current = setTimeout(() => {
      clickTimeout.current = null;
      onToggle();
    }, 250);
  };

  const handleDoubleClick = () => {
    if (isEditing) return;
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    onSetEndLine();
  };

  const handlePointerDown = () => {
    if (isEditing) return;
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setInputValue(numericValue != null ? String(numericValue) : "");
      setIsEditing(true);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const commitValue = () => {
    setIsEditing(false);
    const trimmed = inputValue.trim();
    if (trimmed === "") {
      onSetValue(null);
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) {
        onSetValue(num);
      }
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitValue();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <button
      role="gridcell"
      aria-pressed={isCompleted}
      aria-label={`${habitName}, Day ${dayNumber}, ${isCompleted ? "completed" : "not completed"}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (isEditing) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      data-testid={`cell-habit-${dayNumber}`}
      className={cn(
        "relative h-10 w-full min-w-10 flex items-center justify-center",
        "border-r border-zinc-700",
        !isLastRow && "border-b border-zinc-700",
        "transition-all duration-150 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        "hover-elevate active-elevate-2",
        isCompleted
          ? cn(colorClasses.bg, colorClasses.text)
          : "bg-transparent text-muted-foreground/30 hover:text-muted-foreground/50"
      )}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commitValue}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full h-full bg-black text-foreground text-xs text-center outline-none border-2 border-ring rounded-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <>
          {numericValue != null ? (
            <span className={cn("text-xs font-semibold", colorClasses.text)}>{numericValue}</span>
          ) : (
            isCompleted && <Check className="h-4 w-4" aria-hidden="true" />
          )}
        </>
      )}
      {isEndDay && <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-white/70" />}
    </button>
  );
}
