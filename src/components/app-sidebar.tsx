"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CommandIcon } from "lucide-react";
import Link from "next/link";

const defaultUserMock = {
  id: "default-user",
  name: "Acme User",
  email: "admin@example.com",
  avatar: "/avatars/shadcn.jpg",
};

interface Workspace {
  id: string;
  name: string;
  description: string | null;
}

export function AppSidebar({
  user,
  workspaces = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: any;
  workspaces?: Workspace[];
}) {
  const t = useTranslations("Common");
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">{t("appName")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain workspaces={workspaces} currentPath={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            user
              ? {
                  id: user.id,
                  name: user.name || "User",
                  email: user.email || "",
                  avatar: user.avatar || "https://github.com/shadcn.png",
                }
              : defaultUserMock
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
