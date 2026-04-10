"use server"

import { db } from "@/db/db";
import { workspaces } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper to get authenticated user ID
async function getAuthUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// Fetch all workspaces for the current user
export async function getWorkspaces() {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const results = await db.select().from(workspaces)
    .where(eq(workspaces.userId, userId))
    .orderBy(workspaces.createdAt);
  return results;
}

// Fetch a single workspace
export async function getWorkspace(id: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const results = await db.select().from(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));
  return results[0] || null;
}

// Create a new workspace
export async function createWorkspace(data: { name: string; description?: string }) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const result = await db.insert(workspaces).values({
    name: data.name,
    description: data.description || null,
    userId,
  }).returning();

  revalidatePath("/dashboard", "layout");
  return result[0];
}

// Update a workspace
export async function updateWorkspace(id: string, data: { name?: string; description?: string }) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  await db.update(workspaces)
    .set(data)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// Delete a workspace (cascades to tasks)
export async function deleteWorkspace(id: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));

  revalidatePath("/dashboard", "layout");
  return { success: true };
}
