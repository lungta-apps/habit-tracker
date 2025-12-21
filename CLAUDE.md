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

Required in `.env`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - Secret for express-session

## Architecture

### Overview

Full-stack habit tracking app with:
- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui (New York style)
- **Backend**: Express.js as Vercel serverless function
- **Database**: PostgreSQL via Neon serverless driver + Drizzle ORM

### Directory Structure

```
api/              # Express backend (Vercel serverless entrypoint)
  index.ts        # Express app setup, session middleware, exports as serverless handler
  routes.ts       # API routes (auth + habits), authentication middleware
  storage.ts      # DrizzleStorage class implementing IStorage interface
  vite.ts         # Vite dev middleware setup

client/src/       # React frontend
  components/     # App components (HabitTracker, HabitGrid, etc.)
  components/ui/  # shadcn/ui components (do not edit directly)
  pages/          # Route pages (LoginPage, RegisterPage, not-found)
  hooks/          # Custom hooks (useAuth, use-toast, use-mobile)
  lib/            # Utilities (queryClient, utils)

shared/           # Shared between client and server
  schema.ts       # Drizzle schema (users, habits) + Zod validation schemas
```

### Path Aliases

- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets`

### Data Flow

1. **Authentication**: Session-based auth stored in PostgreSQL via `connect-pg-simple`. Routes protected by `isAuthenticated` middleware in `api/routes.ts`.

2. **Habit Data**: Currently client-side only via localStorage (per-month organization with `YYYY-MM` keys). Server has habit endpoints but frontend uses local storage.

3. **API Routes** (all prefixed `/api`):
   - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
   - `GET /api/habits`, `POST /api/habits` (protected)

### Storage Pattern

`api/storage.ts` exports `IStorage` interface and `DrizzleStorage` implementation. Add new database operations by:
1. Extending `IStorage` interface
2. Implementing in `DrizzleStorage` class

### Key Conventions

- **UI Components**: Use shadcn/ui from `@/components/ui`. Add new components via `npx shadcn@latest add <component>`.
- **Styling**: Tailwind CSS with HSL CSS variables. Dark mode by default. Follow 8-unit spacing grid (2, 4, 6, 8, 12, 16).
- **Routing**: Wouter for client-side routing.
- **State**: TanStack Query for server state, React state + localStorage for UI state.
- **Validation**: Zod schemas in `shared/schema.ts`, used by both frontend forms and backend.

### Deployment

Configured for Vercel:
- `api/index.ts` exports Express app as serverless handler
- `vercel.json` rewrites `/api/*` to the function
- Build outputs client to `dist/`
