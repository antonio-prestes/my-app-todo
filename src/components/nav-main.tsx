"use client";

import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CirclePlusIcon, FolderIcon } from "lucide-react";
import { WorkspaceDialog } from "@/components/workspace-dialog";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
}

export function NavMain({
  workspaces,
  currentPath,
}: {
  workspaces: Workspace[];
  currentPath: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="mb-2">
            <WorkspaceDialog>
              <SidebarMenuButton
                tooltip="Novo Workspace"
                className="justify-center bg-primary text-primary-foreground font-semibold py-2 duration-200 hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <CirclePlusIcon className="mr-2 h-4 w-4" />
                <span>Novo Workspace</span>
              </SidebarMenuButton>
            </WorkspaceDialog>
          </SidebarMenuItem>
        </SidebarMenu>

        {workspaces.length > 0 && (
          <>
            <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-2 mt-2">
              Seus Workspaces
            </SidebarGroupLabel>
            <SidebarMenu>
              {workspaces.map((ws) => {
                const wsPath = `/dashboard/${ws.id}`;
                const isActive = currentPath.includes(ws.id);

                return (
                  <SidebarMenuItem key={ws.id}>
                    <SidebarMenuButton tooltip={ws.name} asChild isActive={isActive}>
                      <Link href={wsPath}>
                        <FolderIcon className="size-4" />
                        <span className="truncate">{ws.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
