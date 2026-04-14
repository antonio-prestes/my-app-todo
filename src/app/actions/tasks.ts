"use server"

import { db } from "@/db/db";
import { tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cached, invalidateCache, cacheKey } from "@/lib/cache";

// Helper to get authenticated user ID
async function getAuthUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// Fetch tasks for a specific workspace
export async function getTasks(workspaceId: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  return cached(
    cacheKey("tasks", userId, workspaceId),
    async () => {
      const results = await db.select().from(tasks)
        .where(and(eq(tasks.userId, userId), eq(tasks.workspaceId, workspaceId)))
        .orderBy(tasks.createdAt);
      return results;
    },
    60 * 5, // 5 minutes TTL
    [`user:${userId}`],
  );
}

// Create
export async function createTask(data: {
  title: string;
  workspaceId: string;
  description?: string;
  status?: string;
  priority?: string;
  tags?: string[];
  assignee?: string;
  assigneeAvatar?: string;
  dueDate?: string;
}) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const result = await db.insert(tasks).values({
    title: data.title,
    description: data.description || null,
    status: data.status || "Todo",
    priority: data.priority || "Medium",
    tags: data.tags,
    assignee: data.assignee,
    assigneeAvatar: data.assigneeAvatar || null,
    dueDate: data.dueDate,
    userId,
    workspaceId: data.workspaceId,
  }).returning();

  // Invalidate tasks cache for this workspace + workspace list (task count changed)
  await invalidateCache(
    cacheKey("tasks", userId, data.workspaceId),
    cacheKey("workspaces", userId),
  );

  revalidatePath("/dashboard", "layout");
  return result[0];
}

// Update Status (Used by Kanban Drag-and-Drop)
export async function updateTaskStatus(id: string, newStatus: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  // Get the task first to know which workspace to invalidate
  const [task] = await db.select({ workspaceId: tasks.workspaceId })
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

  await db.update(tasks)
    .set({ status: newStatus })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

  // Invalidate tasks cache for the affected workspace
  if (task) {
    await invalidateCache(cacheKey("tasks", userId, task.workspaceId));
  }

  return { success: true };
}

// Update full task (Used by Forms)
export async function updateTask(id: string, data: Partial<typeof tasks.$inferInsert>) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  // Get the task first to know which workspace to invalidate
  const [task] = await db.select({ workspaceId: tasks.workspaceId })
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

  await db.update(tasks)
    .set(data)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

  // Invalidate tasks and workspace list (assignee avatars may have changed)
  if (task) {
    await invalidateCache(
      cacheKey("tasks", userId, task.workspaceId),
      cacheKey("workspaces", userId),
    );
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// Delete
export async function deleteTask(id: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  // Get the task first to know which workspace to invalidate
  const [task] = await db.select({ workspaceId: tasks.workspaceId })
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

  // Invalidate tasks cache + workspace list (task count changed)
  if (task) {
    await invalidateCache(
      cacheKey("tasks", userId, task.workspaceId),
      cacheKey("workspaces", userId),
    );
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}
