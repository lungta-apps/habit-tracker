# Habit Tracker

**Part of the DOT (Do One Thing) project** — a collection of focused apps built for personal and career development. Each DOT app does one thing well, with no bloat, no steep learning curve, and no features you'll never use.

**Live app:** [habittracker-lungta.vercel.app](https://habittracker-lungta.vercel.app)

---

## The Idea

Most habit-tracking apps are overbuilt. They come loaded with streaks, gamification, social features, analytics dashboards, and subscription paywalls — all competing for your attention before you've even logged your first habit. The result is an app that becomes a chore to use, which defeats the entire purpose.

This app does one thing: it lets you see your month at a glance and mark off what you did. That's it. Simple enough to actually use every day.

---

## Features

- **Monthly grid view** — each row is a habit or project, each column is a day. One tap to mark it done.
- **Habits and Projects sections** — two separate grids on the same page so you can track daily habits alongside longer-running projects without mixing them together.
- **Per-section monthly notes** — a free-form text area beneath each section for jotting down context, reflections, or goals for the month.
- **Calendar view** — a standard month calendar showing completion dots; tap any date to check off habits for that day.
- **Daily time block planner** — tap any day header to open a full-screen planner where you drag tasks onto a 24-hour grid in 15-minute increments.
- **Month navigation** — move between months freely; when you arrive at an empty month, the app offers to carry your habits forward.
- **Numeric tracking** — long-press a cell to log a number instead of a checkmark (useful for minutes, reps, pages read, etc.).
- **Color coding** — 16 colors to visually distinguish habits and projects at a glance.
- **Drag-and-drop reordering** — rearrange rows by dragging the grip handle.
- **Works on mobile** — touch-optimized: tap to complete, long-press to drag, pull-to-scroll preserved throughout.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Express.js (Vercel serverless) |
| Database | PostgreSQL via Neon + Drizzle ORM |
| Auth | Cookie-based sessions |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |
| Deployment | Vercel |

---

## About the DOT Project

The DOT (Do One Thing) project is a personal initiative to build small, focused tools for everyday use — apps that respect your time and attention by staying out of the way. Each app in the collection is self-contained, solves a specific problem, and is designed to be used daily without friction.

---

## Screenshots

*Coming soon.*

---

## Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your DATABASE_URL and SESSION_SECRET to .env

# Push the database schema
npm run db:push

# Start the dev server
npm run dev
```
