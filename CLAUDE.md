# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server with Vite HMR (http://localhost:5000)
npm run check        # TypeScript type checking (no emit)

# Build
npm run build        # Build client with Vite

# Database
npm run db:push      # Push schema changes to PostgreSQL (Drizzle Kit)
```

## Environment Variables

Required in `.env` (local) and Vercel dashboard (production):
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - Secret for cookie-session encryption

Note: Vercel automatically sets `VERCEL=1` which is used for environment detection.

## Architecture

### Overview

Full-stack habit tracking app with:
- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui (New York style)
- **Backend**: Express.js as Vercel serverless function
- **Database**: PostgreSQL via Neon serverless driver + Drizzle ORM
- **Auth**: Cookie-based sessions via `cookie-session`

### Directory Structure

```
api/              # Express backend (Vercel serverless entrypoint)
  index.ts        # Express app setup, cookie-session middleware, exports as serverless handler
  routes.ts       # API routes (auth + habits + completions), authentication middleware
  storage.ts      # DrizzleStorage class implementing IStorage interface

client/src/       # React frontend
  components/     # App components
    HabitTracker.tsx    # Main component, manages state/mutations, view switching
    HabitGrid.tsx       # Default grid view (days as columns, habits as rows)
    CalendarView.tsx    # Calendar view (7-column Mon-Sun grid)
    CalendarDayCell.tsx # Calendar day cell with completion dots + popover
    DayHabitList.tsx    # Popover content with habit checkboxes
    ViewSwitcher.tsx    # Toggle between grid/calendar views
    AddHabitDialog.tsx  # Popover dialog for adding habits with name/color
    CopyHabitsDialog.tsx # Dialog for copying habits from previous month
    HabitRow.tsx        # Single habit row in grid view
    HabitCell.tsx       # Day cell in grid view
    HabitNameInput.tsx  # Editable habit name with color picker
    ColorPicker.tsx     # Color selection popover
    MonthHeader.tsx     # Header with month navigation and logout
    ProtectedRoute.tsx  # Auth guard wrapper
    TimeBlockPlanner.tsx  # Full-screen daily time block planner modal; owns DndContext + sidebar/calendar layout
    TimeBlockSidebar.tsx  # Left panel: task list with drag handles, add-task form, edit/delete/color menu
    TimeBlockCalendar.tsx # Right panel: 24-hour scrollable grid; placed blocks support move/resize via pointer events
  components/ui/  # shadcn/ui components (do not edit directly)
  pages/          # Route pages (LoginPage, RegisterPage, not-found)
  hooks/          # Custom hooks (useAuth, use-toast, use-mobile)
  lib/            # Utilities (queryClient, utils)

shared/           # Shared between client and server
  schema.ts       # Drizzle schema (users, habits, habit_completions) + Zod validation schemas
```

### Database Schema

```
users
  - id (varchar, PK, UUID)
  - username (text, unique)
  - password (text, bcrypt hashed)

habits
  - id (varchar, PK, UUID)
  - name (text)
  - color (text, default "blue")
  - month (text, format "YYYY-MM") - habits are scoped to a specific month
  - sortOrder (integer, default 0) - user-defined display order within a month
  - userId (varchar, FK -> users.id, cascade delete)
  - createdAt (timestamp)
  - updatedAt (timestamp)

habit_completions
  - id (varchar, PK, UUID)
  - habitId (varchar, FK -> habits.id, cascade delete)
  - completedDate (timestamp, stored at noon UTC)
  - value (integer, nullable) - optional numeric value (minutes, reps, etc.)
  - createdAt (timestamp)

time_blocks
  - id (varchar, PK, UUID)
  - userId (varchar, FK -> users.id, cascade delete)
  - date (text, "YYYY-MM-DD")
  - name (text, notNull)
  - habitId (varchar, FK -> habits.id, set null on delete, nullable)
  - startMinute (integer, minutes from midnight)
  - durationMinutes (integer, default 60)
  - color (text, default "gray")
  - createdAt (timestamp)
```

### Path Aliases

- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets`

### Data Flow

1. **Authentication**: Cookie-based sessions via `cookie-session`. Session data (userId) stored in encrypted cookie. Routes protected by `isAuthenticated` middleware in `api/routes.ts`.

2. **Habit Data**: Stored in PostgreSQL, fetched per-user via API. Frontend uses TanStack Query for caching and mutations. Habits are month-scoped - each habit belongs to a specific month. Creating/deleting a habit only affects that month. When navigating to an empty month, users can copy habits from the previous month via CopyHabitsDialog.

3. **API Routes** (all prefixed `/api`):
   - Auth: `POST /register`, `POST /login`, `POST /logout`, `GET /me`
   - Habits: `GET /habits?month=YYYY-MM`, `POST /habits`, `PATCH /habits/reorder`, `PATCH /habits/:id`, `DELETE /habits/:id`, `POST /habits/copy`
   - Completions: `POST /habits/:id/completions`, `PATCH /habits/:id/completions`, `DELETE /habits/:id/completions`
   - Time Blocks: `GET /time-blocks?date=YYYY-MM-DD`, `POST /time-blocks`, `PATCH /time-blocks/:id`, `DELETE /time-blocks/:id`
   - Debug: `GET /health-check`

### Storage Pattern

`api/storage.ts` exports `IStorage` interface and `DrizzleStorage` implementation. Add new database operations by:
1. Extending `IStorage` interface
2. Implementing in `DrizzleStorage` class

### Views

The app supports two views for tracking habits, switchable via ViewSwitcher component:

1. **Grid View** (default): Days as columns, habits as rows. Horizontal scroll for full month. Click cell to toggle completion. Double-click to toggle end line. Long-press (500ms) opens inline numeric input to enter a value (minutes, reps, etc.) that replaces the checkmark. Day-of-week letters (M, T, W, R, F, S, S) displayed above the grid as subtle reference. Habit name column is frozen (CSS sticky) so names remain visible while scrolling. Drag-and-drop reordering via GripVertical handle on each row (uses @dnd-kit/core + @dnd-kit/sortable). Name column is collapsible via a chevron toggle in the header cell — collapses to 32px showing only the habit's colored dot. Auto-collapses on mobile (window.innerWidth < 640) by default. State persists in localStorage under key `habit-name-column-collapsed`.

2. **Calendar View**: Standard 7-column calendar (Mon-Sun). Shows colored dots for completed habits. Click any date to open popover with habit checkboxes.

3. **Time Block Planner**: Full-screen daily planner opened from the calendar. Left sidebar holds a task list; tasks are dragged onto a 24-hour scrollable grid on the right to create time blocks snapped to 15-minute increments. Placed blocks can be moved (long-press) or resized (drag top/bottom handles), and tapped to reveal a color picker and delete button. Dragging a placed block left off the grid returns it to the sidebar. Uses `@dnd-kit/core` with both `PointerSensor` (desktop) and `TouchSensor` (mobile, 250ms delay). Sidebar task items require `style={{ touchAction: 'none' }}` so the browser does not intercept touch events for scrolling before dnd-kit can register the drag.

   **Mobile drag architecture (TimeBlockCalendar)**:
   - Placed-block moves use a **400ms long-press** to activate, preventing conflicts with scroll. Resize handles activate immediately (unambiguous target).
   - `touch-action: none` is required on draggable content and resize handles.
   - `setPointerCapture` is called on drag activation so pointer events route reliably even when the finger moves off the element.
   - `pointercancel` must be handled alongside `pointerup` — the browser fires `pointercancel` instead of `pointerup` when it takes over a touch (scroll, dnd-kit cleanup). Without it, `dragState` is never cleared and every subsequent touch moves the block.
   - Block position is calculated **absolutely** from the grid top: `gridY = e.clientY - calendarGridRef.current.getBoundingClientRect().top`. This stays correct even if the container scrolls mid-drag. Never use delta-from-startY as it goes stale when the container scrolls.
   - `suppressNextClickRef` suppresses the synthetic click that fires after a completed drag, preventing accidental block selection.
   - `blocksRef` keeps a live copy of the `blocks` prop so the `useEffect` closure can read current block data on `pointerup` without going stale.

   **Auto-scroll**: `calendarScrollRef` (created in `TimeBlockPlanner`, applied to the `overflow-y-auto` div in `TimeBlockCalendar`) is shared by both components. When the pointer enters an 80px zone at the top or bottom edge, a `requestAnimationFrame` loop scrolls the container and recalculates block/preview position each frame so the block tracks the pointer smoothly. Loop is torn down on `pointerup`, `pointercancel`, and `handleDragEnd`.

   **Hour lines**: Rendered in a `pointer-events-none` overlay **above** placed blocks (z-index 25) so they don't bleed through the blocks' `/80` transparent backgrounds, which would create inconsistent brightness depending on block position relative to hour boundaries.

### Key Conventions

- **UI Components**: Use shadcn/ui from `@/components/ui`. Add new components via `npx shadcn@latest add <component>`.
- **Styling**: Tailwind CSS with HSL CSS variables. Dark mode by default. Follow 8-unit spacing grid (2, 4, 6, 8, 12, 16).
- **Routing**: Wouter for client-side routing.
- **State**: TanStack Query for server state, React state for UI state.
- **Validation**: Zod schemas in `shared/schema.ts`, used by both frontend forms and backend.
- **Date Handling**: Store dates at noon UTC to avoid timezone issues. Use `getUTCDate()` when reading.
- **Habit Colors**: 16 colors defined in `HabitTracker.tsx` (`HabitColor` type + `HABIT_COLORS` array). The 16 names are: `red, rose, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, purple, fuchsia, pink`. Organized into 4 rows of 4 in the color picker. Designed for maximum visual distinction: adjacent hues on the wheel are paired with contrasting shade levels (e.g., `rose-300` pale vs `red-500` vivid, `amber-600` dark gold vs `yellow-400` bright, `emerald-700` dark forest vs `green-500` vivid, `sky-300` pale vs `blue-500` vivid, `indigo-600` dark vs `purple-500` vivid). Three lookup tables must stay in sync: `HABIT_COLORS` in `HabitTracker.tsx`, `COLOR_SWATCHES` in `ColorPicker.tsx`, and `DOT_COLORS` in `CalendarDayCell.tsx`.

### Deployment

Configured for Vercel:
- `api/index.ts` exports Express app as serverless handler
- `vercel.json` rewrites `/api/*` to the function
- Build outputs client to `dist/`
- Uses `VERCEL` env var for serverless detection (not `NODE_ENV`)

### Known Considerations

- **Cookie-session**: Session data stored in cookie, limited to ~4KB. Fine for storing just userId.
- **Neon serverless**: Uses HTTP mode on Vercel (WebSockets not supported). Configured via `neonConfig` in `api/index.ts` and `api/storage.ts`.
- **TanStack Query v5**: Uses `gcTime` (not `cacheTime`), no `onSuccess`/`onError` in useQuery.
- **Express route ordering**: Static routes (e.g., `/api/habits/reorder`) must be registered BEFORE parameterized routes (e.g., `/api/habits/:id`), otherwise the param route captures the static segment.
