"use server"

import { db } from "@/db/db";
import { workspaces, tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cached, invalidateCache, invalidateTag, cacheKey } from "@/lib/cache";

// Helper to get authenticated user ID
async function getAuthUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// Fetch all workspaces for the current user with stats
export async function getWorkspaces() {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  return cached(
    cacheKey("workspaces", userId),
    async () => {
      const results = await db.query.workspaces.findMany({
        where: eq(workspaces.userId, userId),
        with: {
          tasks: {
            columns: {
              assignee: true,
              assigneeAvatar: true,
            }
          }
        },
        orderBy: workspaces.createdAt,
      });

      // Transform data to include unique avatars and task counts
      return results.map(ws => {
        const uniqueAvatars = Array.from(new Set(ws.tasks.map(t => t.assigneeAvatar).filter(Boolean)));
        return {
          ...ws,
          taskCount: ws.tasks.length,
          avatars: uniqueAvatars.slice(0, 4) as string[],
        };
      });
    },
    60 * 5, // 5 minutes TTL
    [`user:${userId}`],
  );
}

// Fetch a single workspace
export async function getWorkspace(id: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  return cached(
    cacheKey("workspace", userId, id),
    async () => {
      const results = await db.select().from(workspaces)
        .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));
      return results[0] || null;
    },
    60 * 5,
    [`user:${userId}`],
  );
}

// Create a new workspace
export async function createWorkspace(data: { name: string; description?: string; emoji?: string }) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const result = await db.insert(workspaces).values({
    name: data.name,
    description: data.description || null,
    emoji: data.emoji || null,
    userId,
  }).returning();

  // Invalidate workspace list cache
  await invalidateCache(cacheKey("workspaces", userId));

  revalidatePath("/dashboard", "layout");
  return result[0];
}

// Update a workspace
export async function updateWorkspace(id: string, data: { name?: string; description?: string; emoji?: string }) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  await db.update(workspaces)
    .set(data)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));

  // Invalidate both the specific workspace and the list
  await invalidateCache(
    cacheKey("workspaces", userId),
    cacheKey("workspace", userId, id),
  );

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// Delete a workspace (cascades to tasks)
export async function deleteWorkspace(id: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));

  // Invalidate workspace caches + tasks cache for this workspace
  await invalidateCache(
    cacheKey("workspaces", userId),
    cacheKey("workspace", userId, id),
    cacheKey("tasks", userId, id),
  );

  revalidatePath("/dashboard", "layout");
  return { success: true };
}
