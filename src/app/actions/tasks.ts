"use server"

import { db } from "@/db/db";
import { tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

// Helper to get authenticated user ID
async function getAuthUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// Fetch
export async function getTasks() {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const results = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(tasks.createdAt);
  return results;
}

// Create
export async function createTask(data: { title: string, status?: string, priority?: string, tags?: string[], assignee?: string, dueDate?: string }) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const result = await db.insert(tasks).values({
    ...data,
    userId: userId
  }).returning();

  return result[0];
}

// Update Status (Used by Kanban Drag-and-Drop)
export async function updateTaskStatus(id: string, newStatus: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  await db.update(tasks)
    .set({ status: newStatus })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  
  return { success: true };
}

// Update full task (Used by Forms)
export async function updateTask(id: string, data: Partial<typeof tasks.$inferInsert>) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  await db.update(tasks)
    .set(data)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  
  return { success: true };
}

// Delete
export async function deleteTask(id: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  return { success: true };
}
