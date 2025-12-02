import { type Request, type Response, type NextFunction, type Express } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage.js";
import { insertHabitSchema, authSchema } from "../shared/schema.js";

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
    if (req.session.userId) {
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
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out, please try again." });
      }
      res.status(200).json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
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


  // put application routes here
  // prefix all routes with /api

  app.get("/api/habits", isAuthenticated, async (req, res) => {
    // In a real app, you'd get the userId from the session/token
    const habits = await storage.getHabits(req.session.userId!);
    res.json(habits);
  });

  app.post("/api/habits", isAuthenticated, async (req, res, next) => {
    try {
      // In a real app, you'd get the userId from the session/token
      const parsed = insertHabitSchema.safeParse({
        ...req.body,
        userId: req.session.userId!, 
      });

      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const newHabit = await storage.createHabit(parsed.data);
      res.status(201).json(newHabit);
    } catch (error) {
      next(error);
    }
  });


  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)
}