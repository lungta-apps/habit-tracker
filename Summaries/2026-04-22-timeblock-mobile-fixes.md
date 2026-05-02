# Time Block Planner — Mobile Fixes
**Date:** 2026-04-22  
**Branch:** fix/timeblock2  
**PR:** merged into main

---

## What was fixed

### 1. Ghost drag after sidebar drop (pointercancel)
After dropping a sidebar task onto the calendar, any subsequent touch would move the newly placed block. Root cause: the browser fires `pointercancel` instead of `pointerup` when it takes over a touch gesture (e.g. after dnd-kit releases pointer capture). The document-level drag handler only listened for `pointerup`, so `dragState` was never cleared. Fix: also listen for `pointercancel` and treat it as a cancel (clear state, don't save position).

### 2. Visible resize handles
Added Accomplish-style drag handles: a centered white pill at the top edge, and a slightly tinted strip with a white pill at the bottom edge. Both are `h-4` (16px) hit areas rendered after the block content in the DOM so they naturally stack on top. `touch-action: none` added to both.

### 3. Brighter grid lines and hour labels
Hour labels: `text-muted-foreground/50` → `/80`. Grid lines: `border-zinc-600` → `border-zinc-500`.

### 4. Consistent block transparency
Block backgrounds use `/80` opacity but appeared brighter when entirely within one hour (no grid line showing through) vs. spanning a boundary. Fix: render hour lines in a `pointer-events-none` overlay above the blocks (z-index 25) so they don't composite into the block's transparent background.

### 5. Smooth mobile move drag (long-press + absolute positioning)
Two separate problems:
- **Hard to grab / jumps around**: Without `touch-action: none` the browser intercepted touches as scrolls and fired `pointercancel`. Also, position was calculated as `deltaY` from `startY`, which goes stale if the container scrolls between `pointerdown` and the first `pointermove`.
- Fix: 400ms long-press timer before activating move drags (resize handles still activate immediately). `setPointerCapture` called on activation. Position calculated absolutely: `gridY = e.clientY - grid.getBoundingClientRect().top` — scroll-aware and always correct.

### 6. Auto-scroll while dragging
When dragging a block (or sidebar task) near the top or bottom 80px of the calendar, the container now auto-scrolls. A shared `calendarScrollRef` is created in `TimeBlockPlanner` and passed to `TimeBlockCalendar`. An rAF loop runs during the drag, scrolling the container and recalculating block/preview position each frame so they track the pointer smoothly during the scroll. Loop is stopped on `pointerup`, `pointercancel`, and `handleDragEnd`.

### 7. Return block to sidebar
Long-pressing a placed block and dragging it left off the calendar grid returns it to the sidebar. When `e.clientX < gridRect.left` during a move drag, `returningToSidebarRef` is set and the block fades to 30% opacity (vs 70% for a normal move). On `pointerup` while in this state, the block is deleted from the DB and added back to `sidebarTasks` as a new `SidebarTask`. Dragging back right cancels the return and resumes normal positioning.

### 8. Vite host config
Added `host: true` to `vite.config.ts` `server` block to allow LAN access from mobile devices during development.

---

## Key patterns established

- **`pointercancel` is not optional** on any custom pointer drag system — always handle it alongside `pointerup`.
- **Absolute grid-relative position** (`e.clientY - getBoundingClientRect().top`) is the correct way to calculate drag position in a scrollable container. Delta-from-startY breaks when the container scrolls.
- **`blocksRef`** pattern: keep a live ref to props that are needed inside `useEffect` closures to avoid stale captures.
- **rAF auto-scroll**: scroll the container each frame and recalculate the dragged element's position in the same frame — never rely on `pointermove` alone to update position during auto-scroll.
