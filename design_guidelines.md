# Design Guidelines: Minimal Dark Mode Habit Tracker

## Design Approach
**Selected Framework:** Design System Approach (Productivity-Focused)
**Primary Inspiration:** Linear + Notion aesthetic - clean, functional, data-dense interfaces with excellent typography
**Design Principles:**
- Information clarity over decoration
- Functional minimalism with purposeful whitespace
- Grid-based precision and alignment
- Keyboard-first interaction design

## Typography System
**Font Stack:** Inter (via Google Fonts CDN) for all text
- Month/Year Header: 32px, font-weight 700, letter-spacing -0.02em
- Habit Names (editable): 14px, font-weight 500
- Date Numbers (column headers): 12px, font-weight 600, uppercase
- UI Elements/Labels: 13px, font-weight 400

## Layout & Spacing System
**Tailwind Units:** Consistent use of 2, 4, 6, 8, 12, 16 unit spacing (p-2, m-4, gap-6, etc.)

**Page Structure:**
- Container: max-w-7xl mx-auto px-8
- Header section: py-8 with month/year and navigation
- Grid container: mt-8 with full-width scrollable area
- Vertical rhythm: Maintain 8-unit baseline grid throughout

**Grid Layout:**
- Fixed first column width: w-48 for habit names
- Date columns: min-w-12, equal distribution across remaining width
- Row height: h-12 for consistent clickable targets
- Grid borders: 1px solid with minimal visual weight
- Outer grid padding: p-1

## Component Design

**Calendar Grid:**
- Sticky header row (dates) and first column (habit names)
- Hover states on individual cells for clear interaction feedback
- Cell states: Empty (clickable), Completed (filled with subtle check icon from Heroicons)
- Rounded corners on grid container: rounded-lg
- Shadow depth: shadow-xl for grid elevation

**Month/Year Header:**
- Centered text with left/right navigation arrows (Heroicons: ChevronLeftIcon, ChevronRightIcon)
- Arrow buttons: p-2, rounded-full, positioned absolute or flex justified
- Clear focus states for keyboard navigation

**Habit Name Input:**
- Borderless inline editing in first column cells
- Placeholder text: "New habit..." with reduced opacity
- Focus state: subtle outline indicator
- Delete button appears on row hover (Heroicons: XMarkIcon, size 16px)

**Interactive Elements:**
- All clickable areas minimum 44px touch target
- Focus indicators: 2px outline offset by 2px
- Transition timing: 150ms ease for hover/focus states

## Accessibility Implementation
**Keyboard Navigation:**
- Tab through grid cells in reading order
- Enter/Space to toggle habit completion
- Arrow keys for grid cell navigation
- Escape to exit edit mode on habit names

**ARIA & Semantic HTML:**
- Grid container: role="grid"
- Header cells: role="columnheader" with aria-label="Day [number]"
- Habit name cells: role="gridcell" with contenteditable="true"
- Completion cells: role="gridcell" with aria-pressed state
- Month navigation: aria-label descriptors ("Previous month", "Next month")
- Live region for screen reader announcements on habit toggle

**Visual Accessibility:**
- Text meets WCAG AA contrast requirements (ensure 4.5:1 minimum)
- Clear focus indicators on all interactive elements
- No color-only state indicators (use icons + visual weight)

## Icons
**Library:** Heroicons (via CDN) - solid variant for filled states, outline for navigation
**Usage:**
- Checkmark (CheckIcon): 16px in completed cells
- Navigation arrows (ChevronLeft/Right): 20px
- Delete button (XMarkIcon): 16px
- Add habit row (PlusIcon): 20px at grid bottom

## Responsive Behavior
**Desktop (1024px+):** Full grid visible, all columns displayed
**Tablet (768-1023px):** Horizontal scroll for date columns, sticky first column
**Mobile (<768px):** Stack to list view - show current week only with swipe navigation

## Animation Guidelines
**Minimal Motion:**
- Cell toggle: 150ms scale transform (0.95 → 1.0)
- Hover states: 100ms opacity/transform transitions
- Month navigation: No page transitions, instant update
- NO complex animations, scroll effects, or decorative motion

## Data Visualization
**Empty State:**
- Centered message: "Click any cell to track a habit"
- Subtle illustration or icon (Heroicons: CalendarIcon, 48px)
- Add first habit CTA with PlusIcon

**Completion Indicators:**
- Visual weight difference between empty/filled cells
- Optional subtle progress indicator showing completion percentage per habit row (right-aligned in first column)

## Quality Standards
- Pixel-perfect grid alignment using CSS Grid
- Consistent spacing creates visual rhythm
- Every interactive element has clear affordance
- Keyboard navigation feels natural and predictable
- Screen reader experience provides full context
- Dark mode optimized with reduced eye strain considerations