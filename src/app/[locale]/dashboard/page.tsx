import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getWorkspaces } from "@/app/actions/workspaces";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import { FolderIcon, PlusIcon, ListTodoIcon, UsersIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    avatar: user.user_metadata?.avatar_url || "https://github.com/shadcn.png",
  } : undefined;

  const workspaces = await getWorkspaces();
  const t = await getTranslations("Dashboard");

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <WorkspaceDialog currentUser={currentUser}>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]">
            <PlusIcon className="size-4" />
            {workspaces.length === 0 ? t("createFirst") : t("createNew")}
          </button>
        </WorkspaceDialog>
      </header>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center animate-in fade-in zoom-in duration-300">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FolderIcon className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">{t("emptyTitle")}</h3>
          <p className="text-muted-foreground mt-2 max-w-[280px]">{t("emptyDescription")}</p>
          <WorkspaceDialog currentUser={currentUser}>
            <button className="mt-6 font-medium text-primary hover:underline">
              {t("createFirst")}
            </button>
          </WorkspaceDialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws: any) => (
            <Link 
              key={ws.id} 
              href={`/dashboard/${ws.id}`}
              className="group relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {ws.emoji ? (
                    <span className="size-6 flex items-center justify-center text-xl">{ws.emoji}</span>
                  ) : (
                    <FolderIcon className="size-6" />
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{ws.name}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">
                  {ws.description || "Sem descrição disponível."}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  <ListTodoIcon className="size-4" />
                  <span>{t("tasksCount", { count: ws.taskCount })}</span>
                </div>

                {ws.avatars && ws.avatars.length > 0 && (
                  <div className="flex -space-x-2">
                    {ws.avatars.map((avatar: string, i: number) => (
                      <Avatar key={i} className="size-7 border-2 border-background ring-0">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="text-[10px] bg-muted">?</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground/60 mt-4" suppressHydrationWarning>
                {t("createdAt", { date: new Date(ws.createdAt).toLocaleDateString() })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
