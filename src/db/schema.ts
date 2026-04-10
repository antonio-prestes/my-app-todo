import { pgTable, text, timestamp, jsonb, uuid, boolean, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  status: text("status").notNull().default("Todo"), // Todo, InProgress, Review, Done
  priority: text("priority").notNull().default("Medium"), // Low, Medium, High
  assignee: text("assignee"), // E.g., user name or initials for now
  dueDate: text("due_date"),
  tags: jsonb("tags").$type<string[]>(), // Array of tag strings
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});
