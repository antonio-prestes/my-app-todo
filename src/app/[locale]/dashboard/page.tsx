import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getWorkspaces } from "@/app/actions/workspaces";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import { FolderIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">
            <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gerencie seus espaços de trabalho e organize suas tarefas.
                  </p>
                </div>
                <WorkspaceDialog>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                    <PlusIcon className="size-4" />
                    Novo Workspace
                  </button>
                </WorkspaceDialog>
              </div>

              {/* Workspace Cards Grid */}
              {workspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
                    <FolderIcon className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Nenhum workspace ainda</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Crie seu primeiro workspace para começar a organizar suas tarefas em quadros separados.
                  </p>
                  <WorkspaceDialog>
                    <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                      <PlusIcon className="size-4" />
                      Criar Workspace
                    </button>
                  </WorkspaceDialog>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {workspaces.map((ws) => (
                    <Link
                      key={ws.id}
                      href={`/dashboard/${ws.id}`}
                      className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                          <FolderIcon className="size-5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                          {ws.name}
                        </h3>
                        {ws.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {ws.description}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-auto pt-2 border-t" suppressHydrationWarning>
                        Criado em {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString("pt-BR") : "—"}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
