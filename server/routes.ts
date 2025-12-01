import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHabitSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Create a dev user for development purposes
  let devUser = await storage.getUserByUsername("dev");
  if (!devUser) {
    console.log("Creating dev user");
    // In a real app, you'd want a more secure password
    devUser = await storage.createUser({ username: "dev", password: "password" });
  }
  const DEV_USER_ID = devUser.id;
  console.log(`Working with dev user: ${devUser.username} (ID: ${DEV_USER_ID})`);

  // put application routes here
  // prefix all routes with /api

  app.get("/api/habits", async (req, res) => {
    // In a real app, you'd get the userId from the session/token
    const habits = await storage.getHabits(DEV_USER_ID);
    res.json(habits);
  });

  app.post("/api/habits", async (req, res, next) => {
    try {
      // In a real app, you'd get the userId from the session/token
      const parsed = insertHabitSchema.safeParse({
        ...req.body,
        userId: DEV_USER_ID, 
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

  return httpServer;
}