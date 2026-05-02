import { type Request, type Response, type NextFunction, type Express } from "express";
import bcrypt from "bcrypt";
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns";
import { storage } from "./storage.js";
import { insertHabitSchema, updateHabitSchema, authSchema, insertTimeBlockSchema, updateTimeBlockSchema } from "../shared/schema.js";

// Helper to parse date string and set to noon UTC to avoid timezone issues
function parseDateToNoonUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

// Helper to get day of month from a stored date (handles UTC storage)
function getDayFromStoredDate(date: Date): number {
  return new Date(date).getUTCDate();
}

export async function registerRoutes(
  app: Express
): Promise<void> {

  // Remove dev user creation logic
  // let devUser = await storage.getUserByUsername("dev");
  // if (!devUser) {
  //   console.log("Creating dev user");
  //   // In a real app, you'd want a more secure password
  //   devUser = await storage.createUser({ username: "dev", password: "password" });
  // }
  // const DEV_USER_ID = devUser.id;
  // console.log(`Working with dev user: ${devUser.username} (ID: ${DEV_USER_ID})`);

  // Middleware to ensure user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session?.userId) {
      next();
    } else {
      res.status(401).json({ message: "You must be logged in to access this resource." });
    }
  };

  // ====== AUTHENTICATION ROUTES ======

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const parsed = authSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error.flatten());
      }

      const { username, password } = parsed.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
      });

      req.session.userId = newUser.id;

      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const parsed = authSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error.flatten());
      }

      const { username, password } = parsed.data;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    // Clear the session by setting it to null
    req.session = null;
    res.status(200).json({ message: "Logout successful" });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  });


  // ====== HEALTH CHECK FOR DEBUGGING ======
  app.get("/api/health-check", async (_req, res) => {
    try {
      // Attempt a simple, non-existent query to test the connection
      await storage.getUserByUsername("healthcheck");
      res.status(200).json({ status: "ok", message: "Database connection is successful." });
    } catch (e: any) {
      console.error("Health check failed:", e);
      res.status(500).json({ 
        status: "error", 
        message: "Database connection failed.", 
        error: e.message,
        stack: e.stack,
      });
    }
  });


  // ====== HABIT ROUTES ======

  // Get all habits for user with completions for a given month
  app.get("/api/habits", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const month = req.query.month as string; // Expected format: YYYY-MM

      // Use current month if not provided
      const monthKey = month || format(new Date(), "yyyy-MM");
      const habits = await storage.getHabits(userId, monthKey);

      // Get the month date range
      const monthDate = parseISO(`${monthKey}-01`);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      // Always include completedDays for the month
      const habitsWithCompletions = await Promise.all(
        habits.map(async (habit) => {
          const completions = await storage.getCompletionsForHabit(habit.id, start, end);
          const completedDays = completions.map(c => getDayFromStoredDate(c.completedDate));
          const completionValues: Record<number, number> = {};
          for (const c of completions) {
            if (c.value != null) {
              completionValues[getDayFromStoredDate(c.completedDate)] = c.value;
            }
          }
          return { ...habit, completedDays, completionValues };
        })
      );

      res.json(habitsWithCompletions);
    } catch (error) {
      next(error);
    }
  });

  // Create a new habit
  app.post("/api/habits", isAuthenticated, async (req, res, next) => {
    try {
      // Default to current month if not provided
      const month = req.body.month || format(new Date(), "yyyy-MM");

      const parsed = insertHabitSchema.safeParse({
        ...req.body,
        month,
        userId: req.session.userId!,
      });

      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const newHabit = await storage.createHabit(parsed.data);
      // Return with empty completedDays for consistency
      res.status(201).json({ ...newHabit, completedDays: [] });
    } catch (error) {
      next(error);
    }
  });

  // Reorder habits (must be before /api/habits/:id to avoid :id capturing "reorder")
  app.patch("/api/habits/reorder", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const { habitIds } = req.body;

      if (!habitIds || !Array.isArray(habitIds) || habitIds.length === 0) {
        return res.status(400).json({ message: "habitIds array is required" });
      }

      // Verify all habits belong to the authenticated user
      for (const habitId of habitIds) {
        const habit = await storage.getHabit(habitId);
        if (!habit) {
          return res.status(404).json({ message: `Habit ${habitId} not found` });
        }
        if (habit.userId !== userId) {
          return res.status(403).json({ message: "Not authorized to reorder this habit" });
        }
      }

      await storage.reorderHabits(habitIds);
      res.status(200).json({ message: "Habits reordered" });
    } catch (error) {
      next(error);
    }
  });

  // Update a habit
  app.patch("/api/habits/:id", isAuthenticated, async (req, res, next) => {
    try {
      const habitId = req.params.id;
      const userId = req.session.userId!;

      // Verify habit belongs to user
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this habit" });
      }

      const parsed = updateHabitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const updated = await storage.updateHabit(habitId, parsed.data);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Delete a habit
  app.delete("/api/habits/:id", isAuthenticated, async (req, res, next) => {
    try {
      const habitId = req.params.id;
      const userId = req.session.userId!;

      // Verify habit belongs to user
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this habit" });
      }

      await storage.deleteHabit(habitId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Copy habits from one month to another
  app.post("/api/habits/copy", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const { habitIds, targetMonth } = req.body;

      if (!habitIds || !Array.isArray(habitIds) || habitIds.length === 0) {
        return res.status(400).json({ message: "habitIds array is required" });
      }
      if (!targetMonth || !/^\d{4}-\d{2}$/.test(targetMonth)) {
        return res.status(400).json({ message: "targetMonth is required (format: YYYY-MM)" });
      }

      // Verify all habits belong to user
      for (const habitId of habitIds) {
        const habit = await storage.getHabit(habitId);
        if (!habit) {
          return res.status(404).json({ message: `Habit ${habitId} not found` });
        }
        if (habit.userId !== userId) {
          return res.status(403).json({ message: "Not authorized to copy this habit" });
        }
      }

      const copiedHabits = await storage.copyHabitsToMonth(habitIds, targetMonth, userId);
      // Return with empty completedDays for consistency
      const habitsWithCompletions = copiedHabits.map(h => ({ ...h, completedDays: [] }));
      res.status(201).json(habitsWithCompletions);
    } catch (error) {
      next(error);
    }
  });

  // ====== HABIT COMPLETION ROUTES ======

  // Toggle completion for a specific day
  app.post("/api/habits/:id/completions", isAuthenticated, async (req, res, next) => {
    try {
      const habitId = req.params.id;
      const userId = req.session.userId!;
      const { date, value } = req.body; // Expected: ISO date string or "YYYY-MM-DD"

      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }

      // Verify habit belongs to user
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this habit" });
      }

      const completionDate = parseDateToNoonUTC(date);
      const completion = await storage.addCompletion(habitId, completionDate, value != null ? Number(value) : undefined);
      res.status(201).json(completion);
    } catch (error) {
      next(error);
    }
  });

  // Update completion value for a specific day
  app.patch("/api/habits/:id/completions", isAuthenticated, async (req, res, next) => {
    try {
      const habitId = req.params.id;
      const userId = req.session.userId!;
      const { date, value } = req.body;

      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }

      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this habit" });
      }

      const completionDate = parseDateToNoonUTC(date);
      const updated = await storage.updateCompletionValue(habitId, completionDate, value != null ? Number(value) : null);

      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ message: "Completion not found" });
      }
    } catch (error) {
      next(error);
    }
  });

  // ====== MONTH NOTE ROUTES ======

  app.get("/api/notes", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const { month, section } = req.query as { month?: string; section?: string };
      if (!month || !section) {
        return res.status(400).json({ message: "month and section query params are required" });
      }
      const note = await storage.getMonthNote(userId, month, section);
      res.json({ content: note?.content ?? "" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/notes", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const { month, section, content } = req.body;
      if (!month || !section || content == null) {
        return res.status(400).json({ message: "month, section, and content are required" });
      }
      await storage.upsertMonthNote(userId, month, section, String(content));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // ====== TIME BLOCK ROUTES ======

  app.get("/api/time-blocks", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const date = req.query.date as string;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "date query param required (YYYY-MM-DD)" });
      }
      const blocks = await storage.getTimeBlocks(userId, date);
      res.json(blocks);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/time-blocks", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const parsed = insertTimeBlockSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json(parsed.error);
      const block = await storage.createTimeBlock(parsed.data);
      res.status(201).json(block);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/time-blocks/:id", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const block = await storage.getTimeBlock(req.params.id);
      if (!block) return res.status(404).json({ message: "Time block not found" });
      if (block.userId !== userId) return res.status(403).json({ message: "Not authorized" });
      const parsed = updateTimeBlockSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);
      const updated = await storage.updateTimeBlock(req.params.id, parsed.data);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/time-blocks/:id", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const block = await storage.getTimeBlock(req.params.id);
      if (!block) return res.status(404).json({ message: "Time block not found" });
      if (block.userId !== userId) return res.status(403).json({ message: "Not authorized" });
      await storage.deleteTimeBlock(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Remove completion for a specific day
  app.delete("/api/habits/:id/completions", isAuthenticated, async (req, res, next) => {
    try {
      const habitId = req.params.id;
      const userId = req.session.userId!;
      const { date } = req.body; // Expected: ISO date string or "YYYY-MM-DD"

      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }

      // Verify habit belongs to user
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this habit" });
      }

      const completionDate = parseDateToNoonUTC(date);
      const removed = await storage.removeCompletion(habitId, completionDate);

      if (removed) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Completion not found" });
      }
    } catch (error) {
      next(error);
    }
  });
}