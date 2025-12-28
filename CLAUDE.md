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
  components/     # App components (HabitTracker, HabitGrid, etc.)
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
  - userId (varchar, FK -> users.id, cascade delete)
  - createdAt (timestamp)
  - updatedAt (timestamp)

habit_completions
  - id (varchar, PK, UUID)
  - habitId (varchar, FK -> habits.id, cascade delete)
  - completedDate (timestamp, stored at noon UTC)
  - createdAt (timestamp)
```

### Path Aliases

- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets`

### Data Flow

1. **Authentication**: Cookie-based sessions via `cookie-session`. Session data (userId) stored in encrypted cookie. Routes protected by `isAuthenticated` middleware in `api/routes.ts`.

2. **Habit Data**: Stored in PostgreSQL, fetched per-user via API. Frontend uses TanStack Query for caching and mutations.

3. **API Routes** (all prefixed `/api`):
   - Auth: `POST /register`, `POST /login`, `POST /logout`, `GET /me`
   - Habits: `GET /habits?month=YYYY-MM`, `POST /habits`, `PATCH /habits/:id`, `DELETE /habits/:id`
   - Completions: `POST /habits/:id/completions`, `DELETE /habits/:id/completions`
   - Debug: `GET /health-check`

### Storage Pattern

`api/storage.ts` exports `IStorage` interface and `DrizzleStorage` implementation. Add new database operations by:
1. Extending `IStorage` interface
2. Implementing in `DrizzleStorage` class

### Key Conventions

- **UI Components**: Use shadcn/ui from `@/components/ui`. Add new components via `npx shadcn@latest add <component>`.
- **Styling**: Tailwind CSS with HSL CSS variables. Dark mode by default. Follow 8-unit spacing grid (2, 4, 6, 8, 12, 16).
- **Routing**: Wouter for client-side routing.
- **State**: TanStack Query for server state, React state for UI state.
- **Validation**: Zod schemas in `shared/schema.ts`, used by both frontend forms and backend.
- **Date Handling**: Store dates at noon UTC to avoid timezone issues. Use `getUTCDate()` when reading.

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
