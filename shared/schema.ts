import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const authSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull().default("blue"),
  month: text("month").notNull().default("2026-01"),  // Format: "YYYY-MM"
  sortOrder: integer("sort_order").notNull().default(0),
  endDay: integer("end_day"),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHabitSchema = createInsertSchema(habits).pick({
  name: true,
  userId: true,
  color: true,
  month: true,
});

export const updateHabitSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  endDay: z.number().int().min(1).max(31).nullable().optional(),
});

export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type UpdateHabit = z.infer<typeof updateHabitSchema>;
export type Habit = typeof habits.$inferSelect;

// Habit completions - tracks which days a habit was completed
export const habitCompletions = pgTable("habit_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  habitId: varchar("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  completedDate: timestamp("completed_date").notNull(),
  value: integer("value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).pick({
  habitId: true,
  completedDate: true,
});

export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;

export const timeBlocks = pgTable("time_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // "YYYY-MM-DD"
  name: text("name").notNull(),
  habitId: varchar("habit_id").references(() => habits.id, { onDelete: "set null" }),
  startMinute: integer("start_minute").notNull(), // minutes from midnight
  durationMinutes: integer("duration_minutes").notNull().default(60),
  color: text("color").notNull().default("gray"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimeBlockSchema = z.object({
  userId: z.string(),
  date: z.string(),
  name: z.string().min(1),
  habitId: z.string().nullable().optional(),
  startMinute: z.number().int().min(0).max(1410),
  durationMinutes: z.number().int().min(15).max(1440).default(60),
  color: z.string().default("gray"),
});

export const updateTimeBlockSchema = z.object({
  name: z.string().min(1).optional(),
  habitId: z.string().nullable().optional(),
  startMinute: z.number().int().min(0).max(1410).optional(),
  durationMinutes: z.number().int().min(15).max(1440).optional(),
  color: z.string().optional(),
});

export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;
export type UpdateTimeBlock = z.infer<typeof updateTimeBlockSchema>;
export type TimeBlock = typeof timeBlocks.$inferSelect;
