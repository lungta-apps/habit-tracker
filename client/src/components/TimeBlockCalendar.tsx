import { useState, useRef, useEffect, useCallback, type RefObject } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import { type HabitColor, HABIT_COLORS } from "./HabitTracker";

export const HOUR_HEIGHT = 64; // px per hour — 1 minute = HOUR_HEIGHT/60 px
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;
const LONG_PRESS_MS = 300;
const LONG_PRESS_CANCEL_DISTANCE = 14;
const SCROLL_ZONE_PX = 80;   // distance from edge that activates auto-scroll
const MAX_SCROLL_SPEED = 8;  // px per animation frame

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
  // Grid-relative px anchor so position is correct even if the calendar scrolls.
  // move/resize-top: distance from block's top edge to the touch point.
  // resize-bottom:   distance from block's bottom edge to the touch point.
  anchorPx: number;
  origStartMinute: number;
  origDuration: number;
}

interface DragOverride {
  blockId: string;
  startMinute: number;
  durationMinutes: number;
}

// Module-level helper — no component state needed
function calcDragPosition(
  gridY: number,
  state: DragState
): { newStart: number; newDuration: number } {
  let newStart = state.origStartMinute;
  let newDuration = state.origDuration;

  if (state.type === "move") {
    const rawMin = (gridY - state.anchorPx) / PIXELS_PER_MINUTE;
    newStart = Math.max(0, Math.min(1410, Math.round(rawMin / 15) * 15));
  } else if (state.type === "resize-top") {
    const rawMin = (gridY - state.anchorPx) / PIXELS_PER_MINUTE;
    newStart = Math.max(0, Math.round(rawMin / 15) * 15);
    newDuration = state.origStartMinute + state.origDuration - newStart;
    if (newDuration < 15) {
      newStart = state.origStartMinute + state.origDuration - 15;
      newDuration = 15;
    }
  } else if (state.type === "resize-bottom") {
    const rawBottomMin = (gridY - state.anchorPx) / PIXELS_PER_MINUTE;
    const rawDuration = rawBottomMin - state.origStartMinute;
    newDuration = Math.max(
      15,
      Math.min(1440 - state.origStartMinute, Math.round(rawDuration / 15) * 15)
    );
  }

  return { newStart, newDuration };
}

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

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
  scrollContainerRef: RefObject<HTMLDivElement>;
  onUpdateBlock: (id: string, data: Partial<TimeBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onReturnToSidebar: (block: TimeBlock) => void;
}

export default function TimeBlockCalendar({
  blocks,
  previewMinute,
  calendarGridRef,
  scrollContainerRef,
  onUpdateBlock,
  onDeleteBlock,
  onReturnToSidebar,
}: Props) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverride, setDragOverrideState] = useState<DragOverride | null>(null);
  const dragOverrideRef = useRef<DragOverride | null>(null);
  const suppressNextClickRef = useRef(false);

  // Keep a live ref to blocks so handlePointerUp can read current data
  const blocksRef = useRef(blocks);
  useEffect(() => { blocksRef.current = blocks; });

  // Tracks whether the pointer has left the grid leftward during a move drag.
  // Ref drives the logic; state drives the visual diff.
  const returningToSidebarRef = useRef(false);
  const [returningToSidebar, setReturningToSidebar] = useState(false);
  const setReturning = useCallback((val: boolean) => {
    returningToSidebarRef.current = val;
    setReturningToSidebar(val);
  }, []);

  // Auto-scroll state (refs so the rAF loop always sees current values)
  const autoScrollSpeedRef = useRef(0);
  const autoScrollFrameRef = useRef<number | null>(null);
  const lastClientYRef = useRef(0);

  // Long-press state for move drags
  const longPressRef = useRef<{
    timerId: ReturnType<typeof setTimeout>;
    pointerId: number;
    element: Element;
    blockId: string;
    anchorPx: number;
    origStartMinute: number;
    origDuration: number;
    startX: number;
    startY: number;
  } | null>(null);

  const setDragOverride = useCallback((val: DragOverride | null) => {
    dragOverrideRef.current = val;
    setDragOverrideState(val);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    autoScrollSpeedRef.current = 0;
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current.timerId);
      longPressRef.current = null;
    }
  }, []);

  // Document-level pointer handlers + auto-scroll, active only during a drag
  useEffect(() => {
    if (!dragState) return;

    // Start/update the rAF scroll loop based on pointer proximity to the edge.
    // The loop also recalculates the block position on each frame so the block
    // tracks the pointer smoothly while the container scrolls.
    const tickAutoScroll = () => {
      const sc = scrollContainerRef.current;
      const grid = calendarGridRef.current;
      if (!sc || autoScrollSpeedRef.current === 0) {
        autoScrollFrameRef.current = null;
        return;
      }
      sc.scrollTop += autoScrollSpeedRef.current;
      if (grid) {
        const gridY = lastClientYRef.current - grid.getBoundingClientRect().top;
        const { newStart, newDuration } = calcDragPosition(gridY, dragState);
        setDragOverride({ blockId: dragState.blockId, startMinute: newStart, durationMinutes: newDuration });
      }
      autoScrollFrameRef.current = requestAnimationFrame(tickAutoScroll);
    };

    const updateAutoScroll = (clientY: number) => {
      const sc = scrollContainerRef.current;
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
      if (speed !== 0 && autoScrollFrameRef.current === null) {
        autoScrollFrameRef.current = requestAnimationFrame(tickAutoScroll);
      } else if (speed === 0) {
        stopAutoScroll();
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      lastClientYRef.current = e.clientY;
      const grid = calendarGridRef.current;
      if (!grid) return;
      const gridRect = grid.getBoundingClientRect();

      if (dragState.type === "move" && e.clientX < gridRect.left) {
        // Pointer crossed left into the sidebar — flag as returning, freeze position
        setReturning(true);
        stopAutoScroll();
        return;
      }

      setReturning(false);
      const gridY = e.clientY - gridRect.top;
      const { newStart, newDuration } = calcDragPosition(gridY, dragState);
      setDragOverride({ blockId: dragState.blockId, startMinute: newStart, durationMinutes: newDuration });
      updateAutoScroll(e.clientY);
    };

    const handlePointerUp = () => {
      stopAutoScroll();
      suppressNextClickRef.current = true;
      if (returningToSidebarRef.current) {
        const block = blocksRef.current.find((b) => b.id === dragState.blockId);
        if (block) onReturnToSidebar(block);
        setDragOverride(null);
      } else if (dragOverrideRef.current) {
        onUpdateBlock(dragOverrideRef.current.blockId, {
          startMinute: dragOverrideRef.current.startMinute,
          durationMinutes: dragOverrideRef.current.durationMinutes,
        });
        // Leave dragOverride in place — it holds the block at the dropped position
        // until the blocks prop updates from the server (cleared by the useEffect below).
      }
      setReturning(false);
      setDragState(null);
    };

    const handlePointerCancel = () => {
      stopAutoScroll();
      setReturning(false);
      setDragState(null);
      setDragOverride(null); // cancelled — revert to original position
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      stopAutoScroll();
      setReturning(false);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [dragState, onUpdateBlock, onReturnToSidebar, setDragOverride, setReturning, calendarGridRef, scrollContainerRef, stopAutoScroll]);

  // Once the server-updated block prop matches the committed override, drop the override.
  // This prevents the "bounce" where clearing the override before the mutation lands
  // would snap the block back to its original position for one render.
  useEffect(() => {
    if (!dragOverride || dragState) return;
    const block = blocks.find((b) => b.id === dragOverride.blockId);
    if (
      block &&
      block.startMinute === dragOverride.startMinute &&
      block.durationMinutes === dragOverride.durationMinutes
    ) {
      setDragOverride(null);
    }
  }, [blocks, dragOverride, dragState, setDragOverride]);

  // Resize handles activate immediately — they are unambiguous drag targets
  const startResizeDrag = useCallback(
    (e: React.PointerEvent, blockId: string, type: "resize-top" | "resize-bottom") => {
      e.stopPropagation();
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      const grid = calendarGridRef.current;
      if (!grid) return;

      const gridY = e.clientY - grid.getBoundingClientRect().top;
      const edgePx = type === "resize-top"
        ? block.startMinute * PIXELS_PER_MINUTE
        : (block.startMinute + block.durationMinutes) * PIXELS_PER_MINUTE;

      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      setSelectedBlockId(null);
      setDragState({
        blockId,
        type,
        anchorPx: gridY - edgePx,
        origStartMinute: block.startMinute,
        origDuration: block.durationMinutes,
      });
    },
    [blocks, calendarGridRef]
  );

  // Move drags require a long-press to avoid fighting the scroll gesture
  const handleContentPointerDown = useCallback(
    (e: React.PointerEvent, blockId: string) => {
      e.stopPropagation();
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      const grid = calendarGridRef.current;
      if (!grid) return;

      const gridY = e.clientY - grid.getBoundingClientRect().top;
      const anchorPx = gridY - block.startMinute * PIXELS_PER_MINUTE;
      const element = e.currentTarget as Element;
      const pointerId = e.pointerId;

      longPressRef.current = {
        timerId: setTimeout(() => {
          if (!longPressRef.current) return;
          const lp = longPressRef.current;
          longPressRef.current = null;
          lp.element.setPointerCapture(lp.pointerId);
          navigator.vibrate?.(30);
          setSelectedBlockId(null);
          setDragState({
            blockId: lp.blockId,
            type: "move",
            anchorPx: lp.anchorPx,
            origStartMinute: lp.origStartMinute,
            origDuration: lp.origDuration,
          });
        }, LONG_PRESS_MS),
        pointerId,
        element,
        blockId,
        anchorPx,
        origStartMinute: block.startMinute,
        origDuration: block.durationMinutes,
        startX: e.clientX,
        startY: e.clientY,
      };
    },
    [blocks, calendarGridRef]
  );

  const handleContentPointerMove = useCallback((e: React.PointerEvent) => {
    if (!longPressRef.current) return;
    const dx = e.clientX - longPressRef.current.startX;
    const dy = e.clientY - longPressRef.current.startY;
    if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_CANCEL_DISTANCE) {
      cancelLongPress();
    }
  }, [cancelLongPress]);

  const getBlockPosition = (block: TimeBlock) => {
    const override = dragOverride?.blockId === block.id ? dragOverride : null;
    return {
      startMinute: override?.startMinute ?? block.startMinute,
      durationMinutes: override?.durationMinutes ?? block.durationMinutes,
    };
  };

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto bg-zinc-950"
      onClick={() => setSelectedBlockId(null)}
    >
      <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
        {/* Time labels */}
        <div className="w-14 shrink-0 relative">
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="absolute right-2 text-[10px] text-muted-foreground/80 leading-none"
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
            const bgClass = BLOCK_BG[block.color] ?? "bg-gray-600/80";
            const height = durationMinutes * PIXELS_PER_MINUTE;

            return (
              <div
                key={block.id}
                className={cn(
                  "absolute left-1 right-1 rounded-md select-none transition-opacity",
                  isDragging && !returningToSidebar && "opacity-70",
                  isDragging && returningToSidebar && "opacity-30"
                )}
                style={{ top: startMinute * PIXELS_PER_MINUTE, height, zIndex: isSelected || isDragging ? 20 : 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (suppressNextClickRef.current) {
                    suppressNextClickRef.current = false;
                    return;
                  }
                  setSelectedBlockId(isSelected ? null : block.id);
                }}
              >
                {/* Inner container: bg color + overflow-hidden for rounded corners */}
                <div className={cn("absolute inset-0 rounded-md overflow-hidden", bgClass)}>
                  {/* Action bar shown when selected */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 flex items-center gap-1 z-20">
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

                  {/* Content — long-press to move the block */}
                  <div
                    className="absolute inset-0 px-2 py-2 cursor-grab active:cursor-grabbing text-white"
                    style={{ touchAction: "none" }}
                    onPointerDown={(e) => handleContentPointerDown(e, block.id)}
                    onPointerMove={handleContentPointerMove}
                    onPointerUp={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                  >
                    <div className="text-xs font-semibold truncate leading-tight">{block.name}</div>
                    {height >= 48 && (
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {minutesToLabel(startMinute)} – {minutesToLabel(startMinute + durationMinutes)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top resize handle — semicircle protruding above the block */}
                <div
                  className="absolute -top-3 left-0 right-0 h-6 flex items-start justify-center cursor-n-resize z-10"
                  style={{ touchAction: "none" }}
                  onPointerDown={(e) => startResizeDrag(e, block.id, "resize-top")}
                >
                  <div className="w-6 h-3 rounded-t-full bg-white/50 pointer-events-none" />
                </div>

                {/* Bottom resize handle — semicircle protruding below the block */}
                <div
                  className="absolute -bottom-3 left-0 right-0 h-6 flex items-end justify-center cursor-s-resize z-10"
                  style={{ touchAction: "none" }}
                  onPointerDown={(e) => startResizeDrag(e, block.id, "resize-bottom")}
                >
                  <div className="w-6 h-3 rounded-b-full bg-white/50 pointer-events-none" />
                </div>
              </div>
            );
          })}

          {/* Hour lines rendered above blocks so they don't bleed through transparent block backgrounds */}
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="absolute w-full border-t border-zinc-500 pointer-events-none"
              style={{ top: h * HOUR_HEIGHT, zIndex: 25 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
