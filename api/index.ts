// api/index.ts
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes.js";
import { Pool } from '@neondatabase/serverless'; // Import Pool

const app = express();

// All middleware from the original server file is kept
app.use(
  express.json({
    verify: (req: Request & { rawBody: unknown }, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable not set.");
}

const PgSession = ConnectPgSimple(session);

// Initialize the pool for sessions with serverless-specific settings
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Critical for serverless
  connectionTimeoutMillis: 10000, // Increase timeout
  idleTimeoutMillis: 30000,
});

app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      createTableIfMissing: false, // IMPORTANT: Don't create on every cold start
      tableName: 'session', // Your existing table name
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

// Type augmentation for session must be available in this file as well
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Register all the API routes
registerRoutes(app);

// Final error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) {
    console.error('Headers already sent, cannot send error response:', err);
    return _next(err); // Call next with error to allow Express to handle closing the connection
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Export the app as a serverless function handler
export default app;
