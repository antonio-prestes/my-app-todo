import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaces } from "@/app/actions/workspaces";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const sessionUser = {
    id: user.id,
    name: user.user_metadata.display_name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    avatar: user.user_metadata.avatar_url || "https://github.com/shadcn.png",
  };

  const workspaces = await getWorkspaces();

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
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
