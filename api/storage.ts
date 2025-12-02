import { type User, type InsertUser, type Habit, type InsertHabit, users, habits } from "@shared/schema";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import ws from 'ws'; // Import the ws package

// Configure Neon driver connection based on environment
if (process.env.NODE_ENV !== 'production') {
  // For local development, use ws for WebSocket polyfill
  neonConfig.webSocketConstructor = ws;
} else {
  // For production (Vercel), explicitly disable WebSocket features
  // and force HTTP mode.
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineConnect = false;
  neonConfig.webSocketConstructor = undefined; // Ensure no WebSocket constructor is used
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Limit connections in serverless
  connectionTimeoutMillis: 5000,
});
const db = drizzle(pool, { schema });


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