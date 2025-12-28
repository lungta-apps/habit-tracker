// api/index.ts
import express, { type Request, Response, NextFunction } from "express";
import cookieSession from "cookie-session";
import { registerRoutes } from "./routes.js";

const app = express();

// Trust Vercel's proxy - required for secure cookies and correct protocol detection
app.set('trust proxy', 1);

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

// Cookie-based sessions - no database connection needed
// Session data is stored directly in an encrypted cookie
app.use(
  cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: !!process.env.VERCEL, // true on Vercel (HTTPS), false locally
    httpOnly: true,
    sameSite: 'lax',
  })
);

// Type augmentation for cookie-session
declare global {
  namespace CookieSessionInterfaces {
    interface CookieSessionObject {
      userId?: string;
    }
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
