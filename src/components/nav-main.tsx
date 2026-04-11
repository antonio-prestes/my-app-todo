"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  CirclePlusIcon, 
  FolderIcon, 
  Settings2Icon, 
  PencilIcon, 
  Trash2Icon,
  TableIcon,
  LayoutDashboardIcon
} from "lucide-react";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteWorkspace } from "@/app/actions/workspaces";
import { toast } from "sonner";
import * as React from "react";
import { useTranslations } from "next-intl";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}

export function NavMain({
  workspaces,
  currentPath,
}: {
  workspaces: Workspace[];
  currentPath: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const t = useTranslations("Workspace");
  const tc = useTranslations("Common");

  // Extract active workspace ID from path if present
  const workspaceMatch = currentPath.match(/\/dashboard\/([^\/]+)/);
  const activeWorkspaceId = workspaceMatch ? workspaceMatch[1] : null;

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteWorkspace(id);
      toast.success(t("deleteSuccess") || "Workspace deleted");
      router.push("/dashboard");
    } catch (error) {
      toast.error(t("deleteError") || "Error deleting workspace");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <SidebarGroup>
        <SidebarGroupContent className="px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <WorkspaceDialog>
                <SidebarMenuButton
                  tooltip={t("newWorkspace")}
                  className="w-full justify-center bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg transition-all hover:bg-primary/90 hover:text-primary-foreground active:scale-[0.98] shadow-sm"
                >
                  <CirclePlusIcon className="mr-2 h-4 w-4" />
                  <span>{t("newWorkspace")}</span>
                </SidebarMenuButton>
              </WorkspaceDialog>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="px-2 mb-1">{t("title")}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {workspaces.map((ws) => {
              const wsPath = `/dashboard/${ws.id}`;
              const isActive = activeWorkspaceId === ws.id;

              return (
                <SidebarMenuItem key={ws.id} className="group/ws">
                  <SidebarMenuButton tooltip={ws.name} asChild isActive={isActive}>
                    <Link href={wsPath}>
                      {ws.emoji ? (
                        <span className="size-4 flex items-center justify-center text-sm">{ws.emoji}</span>
                      ) : (
                        <FolderIcon className="size-4" />
                      )}
                      <span>{ws.name}</span>
                    </Link>
                  </SidebarMenuButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction className="opacity-0 group-hover/ws:opacity-100 transition-opacity">
                        <Settings2Icon className="size-4" />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <WorkspaceDialog workspace={ws}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                          <PencilIcon className="mr-2 h-4 w-4" />
                          {t("edit")}
                        </DropdownMenuItem>
                      </WorkspaceDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-500 cursor-pointer">
                            <Trash2Icon className="mr-2 h-4 w-4" />
                            {tc("delete")}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é irreversível. Todas as tarefas vinculadas a <strong>{ws.name}</strong> serão permanentemente excluídas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(ws.id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                              disabled={isDeleting === ws.id}
                            >
                              {isDeleting === ws.id ? tc("delete") + "..." : tc("delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
}
