import {
  type User, type InsertUser,
  type Habit, type InsertHabit, type UpdateHabit,
  type HabitCompletion, type InsertHabitCompletion,
  type TimeBlock, type InsertTimeBlock, type UpdateTimeBlock,
  type MonthNote,
  users, habits, habitCompletions, timeBlocks, monthNotes
} from "../shared/schema.js";
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, gte, lte, asc, sql, max } from 'drizzle-orm';
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
  getHabits(userId: string, month: string): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: string, updates: UpdateHabit): Promise<Habit | undefined>;
  deleteHabit(id: string): Promise<boolean>;
  copyHabitsToMonth(habitIds: string[], targetMonth: string, userId: string): Promise<Habit[]>;
  reorderHabits(habitIds: string[]): Promise<void>;

  // Habit completion methods
  getCompletionsForHabit(habitId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]>;
  getCompletionsForUser(userId: string, month: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]>;
  addCompletion(habitId: string, date: Date, value?: number): Promise<HabitCompletion>;
  updateCompletionValue(habitId: string, date: Date, value: number | null): Promise<HabitCompletion | undefined>;
  removeCompletion(habitId: string, date: Date): Promise<boolean>;

  // Time block methods
  getTimeBlock(id: string): Promise<TimeBlock | undefined>;
  getTimeBlocks(userId: string, date: string): Promise<TimeBlock[]>;
  createTimeBlock(block: InsertTimeBlock): Promise<TimeBlock>;
  updateTimeBlock(id: string, updates: UpdateTimeBlock): Promise<TimeBlock | undefined>;
  deleteTimeBlock(id: string): Promise<boolean>;

  // Month note methods
  getMonthNote(userId: string, month: string, section: string): Promise<MonthNote | undefined>;
  upsertMonthNote(userId: string, month: string, section: string, content: string): Promise<void>;
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
  async getHabits(userId: string, month: string): Promise<Habit[]> {
    return db.query.habits.findMany({
      where: and(eq(habits.userId, userId), eq(habits.month, month)),
      orderBy: [asc(habits.sortOrder), asc(habits.createdAt)],
    });
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    return db.query.habits.findFirst({
      where: eq(habits.id, id),
    });
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    // Auto-assign sortOrder = max existing + 1 for this user+month
    const [maxResult] = await db
      .select({ maxSort: max(habits.sortOrder) })
      .from(habits)
      .where(and(eq(habits.userId, habit.userId), eq(habits.month, habit.month!)));
    const nextSort = (maxResult?.maxSort ?? -1) + 1;

    const result = await db.insert(habits).values({ ...habit, sortOrder: nextSort }).returning();
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

  async copyHabitsToMonth(habitIds: string[], targetMonth: string, userId: string): Promise<Habit[]> {
    // Fetch source habits to get their sortOrder for preserving relative order
    const sourceHabits: Habit[] = [];
    for (const habitId of habitIds) {
      const h = await this.getHabit(habitId);
      if (h && h.userId === userId) sourceHabits.push(h);
    }
    // Sort by original sortOrder to preserve relative ordering
    sourceHabits.sort((a, b) => a.sortOrder - b.sortOrder);

    const copiedHabits: Habit[] = [];
    for (let i = 0; i < sourceHabits.length; i++) {
      const src = sourceHabits[i];
      const result = await db.insert(habits).values({
        name: src.name,
        color: src.color,
        month: targetMonth,
        userId: userId,
        sortOrder: i,
        itemType: src.itemType,
      }).returning();
      copiedHabits.push(result[0]);
    }

    return copiedHabits;
  }

  async reorderHabits(habitIds: string[]): Promise<void> {
    for (let i = 0; i < habitIds.length; i++) {
      await db.update(habits)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(eq(habits.id, habitIds[i]));
    }
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

  async getCompletionsForUser(userId: string, month: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]> {
    // Get all habits for user in the specified month, then get completions for those habits
    const userHabits = await this.getHabits(userId, month);
    const habitIds = userHabits.map(h => h.id);

    if (habitIds.length === 0) return [];

    const allCompletions: HabitCompletion[] = [];
    for (const habitId of habitIds) {
      const completions = await this.getCompletionsForHabit(habitId, startDate, endDate);
      allCompletions.push(...completions);
    }
    return allCompletions;
  }

  async addCompletion(habitId: string, date: Date, value?: number): Promise<HabitCompletion> {
    const result = await db.insert(habitCompletions)
      .values({ habitId, completedDate: date, value: value ?? null })
      .returning();
    return result[0];
  }

  async updateCompletionValue(habitId: string, date: Date, value: number | null): Promise<HabitCompletion | undefined> {
    const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

    const result = await db.update(habitCompletions)
      .set({ value })
      .where(and(
        eq(habitCompletions.habitId, habitId),
        gte(habitCompletions.completedDate, startOfDay),
        lte(habitCompletions.completedDate, endOfDay)
      ))
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

  // Time block methods
  async getTimeBlock(id: string): Promise<TimeBlock | undefined> {
    return db.query.timeBlocks.findFirst({ where: eq(timeBlocks.id, id) });
  }

  async getTimeBlocks(userId: string, date: string): Promise<TimeBlock[]> {
    return db.query.timeBlocks.findMany({
      where: and(eq(timeBlocks.userId, userId), eq(timeBlocks.date, date)),
      orderBy: [asc(timeBlocks.startMinute)],
    });
  }

  async createTimeBlock(block: InsertTimeBlock): Promise<TimeBlock> {
    const result = await db.insert(timeBlocks).values(block).returning();
    return result[0];
  }

  async updateTimeBlock(id: string, updates: UpdateTimeBlock): Promise<TimeBlock | undefined> {
    const result = await db.update(timeBlocks).set(updates).where(eq(timeBlocks.id, id)).returning();
    return result[0];
  }

  async deleteTimeBlock(id: string): Promise<boolean> {
    const result = await db.delete(timeBlocks).where(eq(timeBlocks.id, id)).returning();
    return result.length > 0;
  }

  // Month note methods
  async getMonthNote(userId: string, month: string, section: string): Promise<MonthNote | undefined> {
    return db.query.monthNotes.findFirst({
      where: and(
        eq(monthNotes.userId, userId),
        eq(monthNotes.month, month),
        eq(monthNotes.section, section)
      ),
    });
  }

  async upsertMonthNote(userId: string, month: string, section: string, content: string): Promise<void> {
    await db.insert(monthNotes)
      .values({ userId, month, section, content, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [monthNotes.userId, monthNotes.month, monthNotes.section],
        set: { content, updatedAt: new Date() },
      });
  }
}

export const storage = new DrizzleStorage();