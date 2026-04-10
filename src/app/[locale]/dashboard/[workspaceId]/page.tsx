import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { KanbanBoard } from "@/components/kanban-board";
import { SiteHeader } from "@/components/site-header";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getTasks } from "@/app/actions/tasks";
import { getWorkspace, getWorkspaces } from "@/app/actions/workspaces";
import { TaskDialog } from "@/components/task-dialog";
import { CirclePlusIcon } from "lucide-react";

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const sessionUser = {
    id: user.id,
    name: user.user_metadata.display_name || user.email?.split('@')[0] || "User",
    email: user.email || "",
    avatar: user.user_metadata.avatar_url || "https://github.com/shadcn.png"
  };

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const workspaceId = resolvedParams.workspaceId;
  const isKanban = resolvedSearchParams.view === "kanban";

  // Fetch workspace details
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) {
    notFound();
  }

  // Fetch all workspaces for sidebar + tasks for this workspace
  const [allWorkspaces, dbTasks] = await Promise.all([
    getWorkspaces(),
    getTasks(workspaceId),
  ]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={sessionUser} workspaces={allWorkspaces} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Workspace Header */}
          <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b">
            <div>
              <h1 className="text-lg font-bold tracking-tight">{workspace.name}</h1>
              {workspace.description && (
                <p className="text-sm text-muted-foreground">{workspace.description}</p>
              )}
            </div>
            <TaskDialog workspaceId={workspaceId}>
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                <CirclePlusIcon className="size-4" />
                Nova Tarefa
              </button>
            </TaskDialog>
          </div>

          {/* View Tabs */}
          <WorkspaceTabs workspaceId={workspaceId} />

          {/* Content */}
          <div className="@container/main flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 overflow-hidden">
              {isKanban ? (
                <KanbanBoard data={dbTasks as any} />
              ) : (
                <DataTable data={dbTasks as any} workspaceId={workspaceId} />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
