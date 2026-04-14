"use server"

import { db } from "@/db/db";
import { workspaces, tasks, workspaceMembers, invitations, users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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
      // Fetch workspaces where user is a member
      const memberRecords = await db.select({
        id: workspaces.id,
        name: workspaces.name,
        description: workspaces.description,
        emoji: workspaces.emoji,
        userId: workspaces.userId,
        createdAt: workspaces.createdAt,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId));

      if (memberRecords.length === 0) return [];

      const workspaceIds = memberRecords.map(m => m.id);

      // Fetch limited task data for stats
      const allTasks = await db.select({
        workspaceId: tasks.workspaceId,
        assigneeAvatar: tasks.assigneeAvatar,
      })
      .from(tasks)
      .where(inArray(tasks.workspaceId, workspaceIds));

      // Transform data
      const results = memberRecords.map(m => {
        const wsTasks = allTasks.filter(t => t.workspaceId === m.id);
        const uniqueAvatars = Array.from(new Set(wsTasks.map(t => t.assigneeAvatar).filter(Boolean)));
        
        return {
          id: m.id,
          name: m.name,
          description: m.description,
          emoji: m.emoji,
          userId: m.userId,
          createdAt: m.createdAt,
          role: m.role,
          taskCount: wsTasks.length,
          avatars: uniqueAvatars.slice(0, 4) as string[],
        };
      });

      // Sort by creation date
      return results.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aDate - bDate;
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

  // Validate UUID to avoid Drizzle query crashing on invalid ids
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return null; // Handle smoothly for invalid segments like 'invite'
  }

  return cached(
    cacheKey("workspace", userId, id),
    async () => {
      const result = await db.select({
        id: workspaces.id,
        name: workspaces.name,
        description: workspaces.description,
        emoji: workspaces.emoji,
        userId: workspaces.userId,
        createdAt: workspaces.createdAt,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, userId)))
      .limit(1);

      const record = result[0];
      return record || null;
    },
    60 * 5,
    [`user:${userId}`],
  );
}

// Fetch all members of a workspace
export async function getWorkspaceMembers(workspaceId: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  return cached(
    cacheKey("workspace_members", userId, workspaceId),
    async () => {
      try {
        console.log(`[getWorkspaceMembers] Fetching for workspace: ${workspaceId}`);
        // Get all members joined with their user details using standard join
        const members = await db.select({
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
          name: users.name,
          email: users.email,
          avatar: users.avatarUrl,
        })
        .from(workspaceMembers)
        .leftJoin(users, eq(workspaceMembers.userId, users.id))
        .where(eq(workspaceMembers.workspaceId, workspaceId));

        console.log(`[getWorkspaceMembers] Found ${members.length} raw members:`, members.map(m => m.userId));

        return members.map(m => {
          return {
            id: m.userId,
            name: m.name || "Unknown User",
            email: m.email || "No Email",
            avatar: m.avatar || "https://github.com/shadcn.png",
            role: m.role
          };
        });
      } catch (err) {
        console.error(`[getWorkspaceMembers] SQL Error:`, err);
        throw err;
      }
    },
    60 * 5,
    [`user:${userId}`],
  );
}

// Create a new workspace
export async function createWorkspace(data: { name: string; description?: string; emoji?: string }) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  // Create Workspace
  const result = await db.insert(workspaces).values({
    name: data.name,
    description: data.description || null,
    emoji: data.emoji || null,
    userId, // original creator reference
  }).returning();

  const newWorkspace = result[0];

  // Add the creator as 'owner' to workspace Members mapping
  await db.insert(workspaceMembers).values({
    workspaceId: newWorkspace.id,
    userId: userId,
    role: "owner"
  });

  // Invalidate workspace list cache
  await invalidateCache(cacheKey("workspaces", userId));

  revalidatePath("/dashboard", "layout");
  return newWorkspace;
}

// Update a workspace
export async function updateWorkspace(id: string, data: { name?: string; description?: string; emoji?: string }) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  // Verify access (restrict to owner)
  const [member] = await db.select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, userId)))
    .limit(1);

  if (!member || member.role !== "owner") {
    throw new Error("Only workspace owners can update workspace configurations");
  }

  await db.update(workspaces)
    .set({ ...data })
    .where(eq(workspaces.id, id));

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

  // Verify access
  const [member] = await db.select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, userId)))
    .limit(1);

  if (!member || member.role !== "owner") {
    throw new Error("Only workspace owners can delete workspaces");
  }

  await db.delete(workspaces).where(eq(workspaces.id, id));

  // Invalidate workspace caches + tasks cache for this workspace
  await invalidateCache(
    cacheKey("workspaces", userId),
    cacheKey("workspace", userId, id),
    cacheKey("tasks", userId, id),
  );

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// Invite user
import { sendInviteEmail } from "@/lib/email/send-invite";
import { v4 as uuidv4 } from "uuid";

export async function inviteUser(workspaceId: string, email: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  // Verify access (restrict to owner)
  const [memberResult] = await db.select({
    workspaceId: workspaces.id,
    workspaceName: workspaces.name,
    role: workspaceMembers.role
  })
  .from(workspaceMembers)
  .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
  .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
  .limit(1);

  const member = memberResult;

  if (!member || member.role !== "owner") {
    throw new Error("Somente proprietários podem convidar membros.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const inviterName = user?.user_metadata.display_name || "Alguém";

  // Check if user is already a member
  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  if (existingUser) {
    const [existingMember] = await db.select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, existingUser.id)))
      .limit(1);
    if (existingMember) throw new Error("Este usuário já faz parte do workspace.");
  }

  // Create token
  const token = uuidv4();

  // Save invitation
  await db.insert(invitations).values({
    workspaceId,
    email,
    token,
    role: "guest",
  });

  // Dispatch email
  const emailRes = await sendInviteEmail({
    email,
    inviterName,
    workspaceName: member.workspaceName,
    inviteToken: token,
  });

  if (emailRes.error) throw new Error(emailRes.error);

  return { success: true };
}

// Accept Invitation
export async function acceptInvitation(token: string) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { error: "Unauthorized" };

    console.log(`[acceptInvitation] Processing token: ${token} for user: ${userId}`);

    // Find invitation using standard select
    const inviteResult = await db.select()
      .from(invitations)
      .where(and(eq(invitations.token, token), eq(invitations.status, "pending")))
      .limit(1);

    const invite = inviteResult[0];

    if (!invite) {
      console.warn(`[acceptInvitation] No pending invitation found for token: ${token}`);
      return { error: "Convite inválido ou já foi aceito." };
    }

    // Check if they are already a member
    const [existingMember] = await db.select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, invite.workspaceId), eq(workspaceMembers.userId, userId)))
      .limit(1);

    if (!existingMember) {
      // Insert member
      await db.insert(workspaceMembers).values({
        workspaceId: invite.workspaceId,
        userId: userId,
        role: invite.role,
      });
      console.log(`[acceptInvitation] Added user ${userId} to workspace ${invite.workspaceId}`);
    }

    // Update invite status
    await db.update(invitations)
      .set({ status: "accepted" })
      .where(eq(invitations.id, invite.id));

    // Invalidate caches
    await invalidateCache(cacheKey("workspaces", userId));
    
    return { success: true };
  } catch (err) {
    console.error(`[acceptInvitation] Critical Error:`, err);
    return { error: "Erro interno ao aceitar convite." };
  }
}

