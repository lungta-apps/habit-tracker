import { useState, useRef, useEffect, useCallback, type RefObject } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import { type HabitColor, HABIT_COLORS } from "./HabitTracker";

export const HOUR_HEIGHT = 64; // px per hour — 1 minute = HOUR_HEIGHT/60 px
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;

export interface TimeBlock {
  id: string;
  userId: string;
  date: string;
  name: string;
  habitId: string | null;
  startMinute: number;
  durationMinutes: number;
  color: string;
  createdAt: string;
}

interface DragState {
  blockId: string;
  type: "move" | "resize-top" | "resize-bottom";
  startY: number;
  origStartMinute: number;
  origDuration: number;
}

interface DragOverride {
  blockId: string;
  startMinute: number;
  durationMinutes: number;
}

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

// Muted/dark bg colors for placed blocks — dark enough for white text on all
const BLOCK_BG: Record<string, string> = {
  gray:    "bg-gray-600/80",
  red:     "bg-red-700/80",
  rose:    "bg-rose-600/80",
  orange:  "bg-orange-700/80",
  amber:   "bg-amber-700/80",
  yellow:  "bg-yellow-700/80",
  lime:    "bg-lime-700/80",
  green:   "bg-green-700/80",
  emerald: "bg-emerald-800/80",
  teal:    "bg-teal-700/80",
  cyan:    "bg-cyan-700/80",
  sky:     "bg-sky-700/80",
  blue:    "bg-blue-700/80",
  indigo:  "bg-indigo-700/80",
  purple:  "bg-purple-700/80",
  fuchsia: "bg-fuchsia-700/80",
  pink:    "bg-pink-700/80",
};

function minutesToLabel(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const suffix = h < 12 ? "am" : "pm";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return min === 0 ? `${displayH}${suffix}` : `${displayH}:${String(min).padStart(2, "0")}${suffix}`;
}

interface Props {
  blocks: TimeBlock[];
  previewMinute: number | null;
  calendarGridRef: RefObject<HTMLDivElement>;
  onUpdateBlock: (id: string, data: Partial<TimeBlock>) => void;
  onDeleteBlock: (id: string) => void;
}

export default function TimeBlockCalendar({
  blocks,
  previewMinute,
  calendarGridRef,
  onUpdateBlock,
  onDeleteBlock,
}: Props) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverride, setDragOverrideState] = useState<DragOverride | null>(null);
  const dragOverrideRef = useRef<DragOverride | null>(null);

  const setDragOverride = useCallback((val: DragOverride | null) => {
    dragOverrideRef.current = val;
    setDragOverrideState(val);
  }, []);

  // Document-level pointer handlers active only during a drag
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = e.clientY - dragState.startY;
      const deltaMinRaw = deltaY / PIXELS_PER_MINUTE;

      let newStart = dragState.origStartMinute;
      let newDuration = dragState.origDuration;

      if (dragState.type === "move") {
        newStart = Math.max(0, Math.min(1410, Math.round((dragState.origStartMinute + deltaMinRaw) / 15) * 15));
      } else if (dragState.type === "resize-top") {
        newStart = Math.max(0, Math.round((dragState.origStartMinute + deltaMinRaw) / 15) * 15);
        newDuration = dragState.origStartMinute + dragState.origDuration - newStart;
        if (newDuration < 15) {
          newStart = dragState.origStartMinute + dragState.origDuration - 15;
          newDuration = 15;
        }
      } else if (dragState.type === "resize-bottom") {
        newDuration = Math.max(15, Math.round((dragState.origDuration + deltaMinRaw) / 15) * 15);
        newDuration = Math.min(newDuration, 1440 - dragState.origStartMinute);
      }

      setDragOverride({ blockId: dragState.blockId, startMinute: newStart, durationMinutes: newDuration });
    };

    const handlePointerUp = () => {
      if (dragOverrideRef.current) {
        onUpdateBlock(dragOverrideRef.current.blockId, {
          startMinute: dragOverrideRef.current.startMinute,
          durationMinutes: dragOverrideRef.current.durationMinutes,
        });
      }
      setDragState(null);
      setDragOverride(null);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState, onUpdateBlock, setDragOverride]);

  const startDrag = useCallback(
    (e: React.PointerEvent, blockId: string, type: DragState["type"]) => {
      e.preventDefault();
      e.stopPropagation();
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      setSelectedBlockId(null);
      setDragState({
        blockId,
        type,
        startY: e.clientY,
        origStartMinute: block.startMinute,
        origDuration: block.durationMinutes,
      });
    },
    [blocks]
  );

  const getBlockPosition = (block: TimeBlock) => {
    const override = dragOverride?.blockId === block.id ? dragOverride : null;
    return {
      startMinute: override?.startMinute ?? block.startMinute,
      durationMinutes: override?.durationMinutes ?? block.durationMinutes,
    };
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950" onClick={() => setSelectedBlockId(null)}>
      <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
        {/* Time labels */}
        <div className="w-14 shrink-0 relative">
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="absolute right-2 text-[10px] text-muted-foreground/50 leading-none"
              style={{ top: Math.max(2, h * HOUR_HEIGHT - 5) }}
            >
              {formatHour(h)}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          ref={calendarGridRef}
          className="flex-1 relative border-l border-zinc-800"
        >

          {/* Hour lines */}
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="absolute w-full border-t border-zinc-600"
              style={{ top: h * HOUR_HEIGHT }}
            />
          ))}

          {/* Preview placeholder during sidebar drag */}
          {previewMinute !== null && (
            <div
              className="absolute left-1 right-1 rounded-md bg-muted/60 border border-dashed border-border pointer-events-none flex items-center px-2"
              style={{
                top: previewMinute * PIXELS_PER_MINUTE,
                height: 60 * PIXELS_PER_MINUTE,
              }}
            >
              <span className="text-[10px] text-muted-foreground">{minutesToLabel(previewMinute)}</span>
            </div>
          )}

          {/* Placed blocks */}
          {blocks.map((block) => {
            const { startMinute, durationMinutes } = getBlockPosition(block);
            const isSelected = selectedBlockId === block.id;
            const isDragging = dragState?.blockId === block.id;
            const bgClass = BLOCK_BG[block.color] ?? "bg-gray-600";
            const height = durationMinutes * PIXELS_PER_MINUTE;

            return (
              <div
                key={block.id}
                className={cn(
                  "absolute left-1 right-1 rounded-md overflow-hidden select-none transition-opacity",
                  bgClass,
                  isDragging && "opacity-70"
                )}
                style={{ top: startMinute * PIXELS_PER_MINUTE, height, zIndex: isSelected || isDragging ? 20 : 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBlockId(isSelected ? null : block.id);
                }}
              >
                {/* Top resize handle */}
                <div
                  className="absolute top-0 left-0 right-0 h-2 cursor-n-resize"
                  onPointerDown={(e) => startDrag(e, block.id, "resize-top")}
                />

                {/* Action bar shown when selected */}
                {isSelected && (
                  <div className="absolute top-1 right-1 flex items-center gap-1 z-10">
                    <div
                      className="bg-black/30 rounded p-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ColorPicker
                        value={(block.color === "gray" ? "blue" : block.color) as HabitColor}
                        onChange={(color) => onUpdateBlock(block.id, { color })}
                      />
                    </div>
                    <button
                      className="bg-black/30 rounded p-1 text-white hover:bg-black/50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBlock(block.id);
                        setSelectedBlockId(null);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Content — draggable to move the block */}
                <div
                  className="px-2 pt-2 pb-4 cursor-grab active:cursor-grabbing text-white"
                  onPointerDown={(e) => startDrag(e, block.id, "move")}
                >
                  <div className="text-xs font-semibold truncate leading-tight">{block.name}</div>
                  {height >= 40 && (
                    <div className="text-[10px] opacity-80 mt-0.5">
                      {minutesToLabel(startMinute)} – {minutesToLabel(startMinute + durationMinutes)}
                    </div>
                  )}
                </div>

                {/* Bottom resize handle */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize"
                  onPointerDown={(e) => startDrag(e, block.id, "resize-bottom")}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
