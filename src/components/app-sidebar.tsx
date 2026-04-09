"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CommandIcon, LayoutListIcon, KanbanSquareIcon } from "lucide-react"

const defaultUserMock = {
  name: "Acme User",
  email: "admin@example.com",
  avatar: "/avatars/shadcn.jpg",
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user?: any }) {
  const tNav = useTranslations("Navigation")
  const searchParams = useSearchParams()
  const view = searchParams.get("view")

  const navMain = [
    {
      title: tNav("tableView"),
      url: "/dashboard",
      icon: <LayoutListIcon />,
      isActive: view !== "kanban",
    },
    {
      title: tNav("kanbanView"),
      url: "/dashboard?view=kanban",
      icon: <KanbanSquareIcon />,
      isActive: view === "kanban",
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">Workspace</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
         <NavUser user={user ? { name: user.name || "User", email: user.email || "", avatar: user.image || "https://github.com/shadcn.png" } : defaultUserMock} />
      </SidebarFooter>
    </Sidebar>
  )
}

