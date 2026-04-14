import { DataTable } from "@/components/data-table";
import { KanbanBoard } from "@/components/kanban-board";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getTasks } from "@/app/actions/tasks";
import { getWorkspace } from "@/app/actions/workspaces";
import { TaskDialog } from "@/components/task-dialog";
import { CirclePlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("Tasks");
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

  // Fetch tasks for this workspace
  const dbTasks = await getTasks(workspaceId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Workspace Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          {workspace.emoji && (
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shadow-inner border border-primary/20">
              {workspace.emoji}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-sm text-muted-foreground">{workspace.description}</p>
            )}
          </div>
        </div>
        <TaskDialog
          workspaceId={workspaceId}
          currentUser={{ name: sessionUser.name, avatar: sessionUser.avatar }}
        >
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <CirclePlusIcon className="size-4" />
            {t("addTask")}
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
  );
}
