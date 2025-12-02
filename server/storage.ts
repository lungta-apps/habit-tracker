import { type User, type InsertUser, type Habit, type InsertHabit, users, habits } from "@shared/schema";
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

// Force the Neon driver to use HTTP connections
// as Vercel serverless functions do not support WebSockets.
neonConfig.fetchConnectionCache = true;
neonConfig.webSocketConstructor = undefined;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });


// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Habit methods
  getHabits(userId: string): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
}

export class DrizzleStorage implements IStorage {
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

  async getHabits(userId: string): Promise<Habit[]> {
    return db.query.habits.findMany({
        where: eq(habits.userId, userId),
    });
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const result = await db.insert(habits).values(habit).returning();
    return result[0];
  }
}

export const storage = new DrizzleStorage();