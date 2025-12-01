import { X } from "lucide-react";
import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import { HabitColor } from "./HabitTracker";

interface HabitNameInputProps {
  value: string;
  color: HabitColor;
  onChange: (value: string) => void;
  onColorChange: (color: HabitColor) => void;
  onDelete: () => void;
  placeholder?: string;
  isLastRow?: boolean;
}

export default function HabitNameInput({
  value,
  color,
  onChange,
  onColorChange,
  onDelete,
  placeholder = "New habit...",
  isLastRow = false,
}: HabitNameInputProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center h-10 px-2 gap-1",
        "border-r border-border/50",
        !isLastRow && "border-b",
        "bg-card/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="gridcell"
    >
      <ColorPicker value={color} onChange={onColorChange} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
