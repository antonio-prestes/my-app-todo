import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { KanbanBoard } from "@/components/kanban-board";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTasks } from "@/app/actions/tasks";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/"); // Block unauthenticated access
  }

  const sessionUser = {
    id: user.id,
    name: user.user_metadata.display_name || user.email?.split('@')[0] || "User",
    email: user.email || "",
    avatar: user.user_metadata.avatar_url || "https://github.com/shadcn.png"
  };

  const resolvedParams = await searchParams;
  const isKanban = resolvedParams.view === "kanban";

  // Fetch true live tasks directly from Neon.
  const dbTasks = await getTasks();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={sessionUser} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 overflow-hidden">
              {isKanban ? (
                <KanbanBoard data={dbTasks as any} />
              ) : (
                <DataTable data={dbTasks as any} />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
