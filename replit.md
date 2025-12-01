# Habit Tracker Application

## Overview

A minimalist dark-mode habit tracking web application with a monthly calendar grid interface. The application allows users to track daily habits across a month, with each row representing a habit and each column representing a day. The UI is inspired by Linear and Notion's clean, functional aesthetics with excellent typography and keyboard-first interaction design.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server with HMR support
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for state management and data synchronization

**UI Component System:**
- Radix UI primitives for accessible, unstyled component foundations
- Shadcn/ui component library (New York style variant) for pre-built UI components
- Tailwind CSS for utility-first styling with custom design tokens
- Class Variance Authority (CVA) for component variant management
- Custom CSS variables for theme customization (dark mode as default)

**Design System:**
- Typography: Inter font family loaded via Google Fonts CDN
- Color system: HSL-based with custom CSS variables for theming
- Spacing system: Tailwind's 8-unit baseline grid (2, 4, 6, 8, 12, 16)
- Component design follows Linear/Notion aesthetic with minimal decoration
- Keyboard-first interaction patterns with proper focus management

**State Management:**
- Local storage for data persistence (habit data stored per month)
- Month-based data organization with YYYY-MM keys
- In-memory state management for UI interactions
- No server-side state synchronization in current implementation

### Backend Architecture

**Server Framework:**
- Express.js as the HTTP server framework
- Node.js HTTP server with potential for WebSocket upgrades
- Middleware: JSON parsing, URL-encoded bodies, CORS support
- Custom logging middleware for request/response tracking

**API Structure:**
- RESTful API design pattern with /api prefix for all endpoints
- Route registration through centralized `registerRoutes` function
- Storage abstraction layer through `IStorage` interface
- Currently implements in-memory storage (`MemStorage`) for user data

**Build & Deployment:**
- ESBuild for server-side bundling with selective dependency bundling
- Vite for client-side bundling with code splitting
- Production build outputs to `dist/` directory
- Development mode uses Vite middleware for HMR

### Data Storage

**Current Implementation:**
- Client-side: LocalStorage for habit tracking data (per-month organization)
- Server-side: In-memory storage implementation (MemStorage class)

**Schema Design:**
- PostgreSQL dialect configured via Drizzle ORM
- User authentication schema prepared (users table with username/password)
- Schema location: `shared/schema.ts` for type sharing between client/server

**Database Integration Ready:**
- Drizzle Kit configured for PostgreSQL migrations
- Neon Database serverless driver integrated
- Connection pooling via `connect-pg-simple` for session storage
- Migration scripts in `migrations/` directory (when generated)

### Authentication & Authorization

**Prepared Infrastructure:**
- User schema with username and password fields
- Validation schemas using Zod and drizzle-zod
- Storage interface includes user CRUD operations
- Authentication middleware ready for implementation
- Session management capabilities via express-session

**Not Yet Implemented:**
- User registration and login flows
- Password hashing and validation
- Session-based authentication
- Protected route middleware

### External Dependencies

**Primary UI Libraries:**
- Radix UI (20+ component primitives for accessibility)
- Tailwind CSS v3+ with PostCSS for processing
- Heroicons/Lucide React for iconography
- date-fns for date manipulation and formatting

**Backend Services:**
- Neon Database (@neondatabase/serverless) for PostgreSQL hosting
- Drizzle ORM for type-safe database queries
- Express.js ecosystem (express-session, express-rate-limit)

**Development Tools:**
- TypeScript for type checking across client and server
- TSX for TypeScript execution in development
- Vite plugins for Replit integration (cartographer, dev-banner, runtime-error-modal)

**Future Integration Points:**
- Payment processing prepared via Stripe dependency
- Email capabilities via Nodemailer
- File uploads via Multer
- AI capabilities via OpenAI and Google Generative AI SDKs