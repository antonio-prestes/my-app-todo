"use server"

import { db } from "@/db/db";
import { workspaces, tasks, workspaceMembers, invitations } from "@/db/schema";
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
      const memberRecords = await db.query.workspaceMembers.findMany({
        where: eq(workspaceMembers.userId, userId),
        with: {
          workspace: {
            with: {
              tasks: {
                columns: {
                  assignee: true,
                  assigneeAvatar: true,
                }
              }
            }
          }
        }
      });

      // Transform data to include unique avatars and task counts
      const results = memberRecords.map(m => {
        const ws = m.workspace;
        // Collect unique avatars of assignees in this workspace
        const uniqueAvatars = Array.from(new Set(ws.tasks.map(t => t.assigneeAvatar).filter(Boolean)));
        return {
          ...ws,
          role: m.role,
          taskCount: ws.tasks.length,
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
      const memberRecord = await db.query.workspaceMembers.findFirst({
        where: and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, userId)),
        with: {
          workspace: true
        }
      });
      return memberRecord ? { ...memberRecord.workspace, role: memberRecord.role } : null;
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
        // Get all members joined with their user details
        const members = await db.query.workspaceMembers.findMany({
          where: eq(workspaceMembers.workspaceId, workspaceId),
          with: {
            user: true
          }
        });

        console.log(`[getWorkspaceMembers] Found ${members.length} raw members:`, members.map(m => m.userId));

        return members.map(m => {
          if (!m.user) {
            console.warn(`[getWorkspaceMembers] WARNING: Missing user object for member ${m.userId}`);
          }
          return {
            id: m.userId,
            name: m.user?.name || "Unknown User",
            email: m.user?.email || "No Email",
            avatar: m.user?.avatarUrl || "https://github.com/shadcn.png",
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
  const member = await db.query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, userId))
  });

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
  const member = await db.query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, userId))
  });

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
import { users } from "@/db/schema";

export async function inviteUser(workspaceId: string, email: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  // Verify access (restrict to owner)
  const member = await db.query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
    with: {
      workspace: true
    }
  });

  if (!member || member.role !== "owner") {
    throw new Error("Somente proprietários podem convidar membros.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const inviterName = user?.user_metadata.display_name || "Alguém";

  // Check if user is already a member
  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  if (existingUser) {
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, existingUser.id))
    });
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
    workspaceName: member.workspace.name,
    inviteToken: token,
  });

  if (emailRes.error) throw new Error(emailRes.error);

  return { success: true };
}

// Accept Invitation
export async function acceptInvitation(token: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Find invitation
  const invite = await db.query.invitations.findFirst({
    where: and(eq(invitations.token, token), eq(invitations.status, "pending")),
  });

  if (!invite) return { error: "Convite inválido ou já foi aceito." };

  // Make sure the email matches the invite (optional, but good for security)
  if (invite.email.toLowerCase() !== user?.email?.toLowerCase()) {
    return { error: "Este convite foi enviado para outro e-mail." };
  }

  // Check if they are already a member
  const member = await db.query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.workspaceId, invite.workspaceId), eq(workspaceMembers.userId, userId))
  });

  if (!member) {
    // Insert member
    await db.insert(workspaceMembers).values({
      workspaceId: invite.workspaceId,
      userId: userId,
      role: invite.role,
    });
  }

  // Update invite status
  await db.update(invitations)
    .set({ status: "accepted" })
    .where(eq(invitations.id, invite.id));

  // Invalidate caches
  await invalidateCache(cacheKey("workspaces", userId));
  
  return { success: true };
}

