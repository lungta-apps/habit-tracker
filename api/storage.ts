import {
  type User, type InsertUser,
  type Habit, type InsertHabit, type UpdateHabit,
  type HabitCompletion, type InsertHabitCompletion,
  users, habits, habitCompletions
} from "../shared/schema.js";
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import * as schema from '../shared/schema.js';

// Configure WebSocket for local development only
// On Vercel, neonConfig is set in index.ts before any Pool is created
if (!process.env.VERCEL) {
  // Dynamic import to avoid loading ws on Vercel
  import('ws').then((ws) => {
    neonConfig.webSocketConstructor = ws.default;
  });
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });


// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Habit methods
  getHabits(userId: string): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: string, updates: UpdateHabit): Promise<Habit | undefined>;
  deleteHabit(id: string): Promise<boolean>;

  // Habit completion methods
  getCompletionsForHabit(habitId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]>;
  getCompletionsForUser(userId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]>;
  addCompletion(habitId: string, date: Date): Promise<HabitCompletion>;
  removeCompletion(habitId: string, date: Date): Promise<boolean>;
}

export class DrizzleStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.username, username),
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Habit methods
  async getHabits(userId: string): Promise<Habit[]> {
    return db.query.habits.findMany({
      where: eq(habits.userId, userId),
      orderBy: [asc(habits.createdAt)],
    });
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    return db.query.habits.findFirst({
      where: eq(habits.id, id),
    });
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const result = await db.insert(habits).values(habit).returning();
    return result[0];
  }

  async updateHabit(id: string, updates: UpdateHabit): Promise<Habit | undefined> {
    const result = await db.update(habits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(habits.id, id))
      .returning();
    return result[0];
  }

  async deleteHabit(id: string): Promise<boolean> {
    const result = await db.delete(habits).where(eq(habits.id, id)).returning();
    return result.length > 0;
  }

  // Habit completion methods
  async getCompletionsForHabit(habitId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]> {
    return db.query.habitCompletions.findMany({
      where: and(
        eq(habitCompletions.habitId, habitId),
        gte(habitCompletions.completedDate, startDate),
        lte(habitCompletions.completedDate, endDate)
      ),
    });
  }

  async getCompletionsForUser(userId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]> {
    // Get all habits for user, then get completions for those habits
    const userHabits = await this.getHabits(userId);
    const habitIds = userHabits.map(h => h.id);

    if (habitIds.length === 0) return [];

    const allCompletions: HabitCompletion[] = [];
    for (const habitId of habitIds) {
      const completions = await this.getCompletionsForHabit(habitId, startDate, endDate);
      allCompletions.push(...completions);
    }
    return allCompletions;
  }

  async addCompletion(habitId: string, date: Date): Promise<HabitCompletion> {
    const result = await db.insert(habitCompletions)
      .values({ habitId, completedDate: date })
      .returning();
    return result[0];
  }

  async removeCompletion(habitId: string, date: Date): Promise<boolean> {
    // Remove completion for the specific date (compare date portion only in UTC)
    const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

    const result = await db.delete(habitCompletions)
      .where(and(
        eq(habitCompletions.habitId, habitId),
        gte(habitCompletions.completedDate, startOfDay),
        lte(habitCompletions.completedDate, endOfDay)
      ))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DrizzleStorage();