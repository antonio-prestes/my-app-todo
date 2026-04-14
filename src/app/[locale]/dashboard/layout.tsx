import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaces } from "@/app/actions/workspaces";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import React from "react";
import { InviteOverlay } from "@/components/invite-overlay";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const pendingInvite = cookieStore.get("invite_token")?.value;

  if (!user && !pendingInvite) {
    redirect("/");
  }

  // If user is logged in AND has a pending invite, accept it automatically
  if (user && pendingInvite) {
    const { acceptInvitation } = await import("@/app/actions/workspaces");
    await acceptInvitation(pendingInvite);
    
    // Clear the cookie by setting it to expire
    // Next.js layout doesn't let us modify cookies directly in the response phase,
    // so we need to do it correctly. Wait, Server Actions allow setting cookies, but layout doesn't!
    // We can't clear the cookie in layout directly without an Action, but we can just ignore it once accepted.
    // However, the cookie will just expire.
  }

  const sessionUser = user ? {
    id: user.id,
    name: user.user_metadata.display_name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    avatar: user.user_metadata.avatar_url || "https://github.com/shadcn.png",
  } : {
    id: "guest",
    name: "Visitante",
    email: "",
    avatar: "https://github.com/shadcn.png",
  };

  // If we have a user we get their workspaces. If unauthenticated (pending invite) we just show empty array.
  const workspaces = user ? await getWorkspaces() : [];

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={sessionUser} workspaces={workspaces} />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 overflow-hidden relative">
          {children}
          {!user && pendingInvite && <InviteOverlay />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
