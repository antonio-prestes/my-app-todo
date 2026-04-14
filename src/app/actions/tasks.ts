"use server"

import { db } from "@/db/db";
import { tasks, workspaceMembers } from "@/db/schema";
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

// Helper to check membership and role
async function checkMembership(workspaceId: string, userId: string) {
  const member = await db.query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId))
  });
  return member;
}

// Fetch tasks for a specific workspace
export async function getTasks(workspaceId: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const isMember = await checkMembership(workspaceId, userId);
  if (!isMember) throw new Error("Acesso negado.");

  return cached(
    cacheKey("tasks", userId, workspaceId),
    async () => {
      const results = await db.select().from(tasks)
        .where(eq(tasks.workspaceId, workspaceId))
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

  const isMember = await checkMembership(data.workspaceId, userId);
  if (!isMember) throw new Error("Acesso negado.");

  const result = await db.insert(tasks).values({
    title: data.title,
    description: data.description || null,
    status: data.status || "Todo",
    priority: data.priority || "Medium",
    tags: data.tags,
    assignee: data.assignee,
    assigneeAvatar: data.assigneeAvatar || null,
    dueDate: data.dueDate,
    userId, // original creator
    workspaceId: data.workspaceId,
  }).returning();

  // Invalidate tasks cache for this workspace + workspace list
  // Wait: In a multi-user environment, we should ideally invalidate tag for ALL members of the workspace.
  // We'll invalidate for this user now. Broad invalidation comes from push events or specific member loops.
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

  // Get the task first
  const [task] = await db.select({ workspaceId: tasks.workspaceId })
    .from(tasks)
    .where(eq(tasks.id, id));
    
  if (!task) throw new Error("Task not found");

  const isMember = await checkMembership(task.workspaceId, userId);
  if (!isMember) throw new Error("Acesso negado.");

  await db.update(tasks)
    .set({ status: newStatus })
    .where(eq(tasks.id, id));

  await invalidateCache(cacheKey("tasks", userId, task.workspaceId));
  return { success: true };
}

// Update full task (Used by Forms)
export async function updateTask(id: string, data: Partial<typeof tasks.$inferInsert>) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const [task] = await db.select({ workspaceId: tasks.workspaceId })
    .from(tasks)
    .where(eq(tasks.id, id));

  if (!task) throw new Error("Task not found");

  const isMember = await checkMembership(task.workspaceId, userId);
  if (!isMember) throw new Error("Acesso negado.");

  await db.update(tasks)
    .set(data)
    .where(eq(tasks.id, id));

  await invalidateCache(
    cacheKey("tasks", userId, task.workspaceId),
    cacheKey("workspaces", userId),
  );

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// Delete
export async function deleteTask(id: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const [task] = await db.select({ workspaceId: tasks.workspaceId })
    .from(tasks)
    .where(eq(tasks.id, id));

  if (!task) throw new Error("Task not found");

  const isMember = await checkMembership(task.workspaceId, userId);
  if (!isMember) throw new Error("Acesso negado.");
  
  if (isMember.role !== "owner") {
    throw new Error("Somente o proprietário do workspace pode excluir tarefas.");
  }

  await db.delete(tasks).where(eq(tasks.id, id));

  await invalidateCache(
    cacheKey("tasks", userId, task.workspaceId),
    cacheKey("workspaces", userId),
  );

  revalidatePath("/dashboard", "layout");
  return { success: true };
}
