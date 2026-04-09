"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CirclePlusIcon, MailIcon } from "lucide-react";
import { CreateTaskDialog } from "@/components/create-task-dialog";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
    isActive?: boolean;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="mb-4">
            <CreateTaskDialog>
              <SidebarMenuButton
                tooltip="Nova Tarefa"
                className="justify-center bg-primary text-primary-foreground font-semibold py-2 duration-200 hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <CirclePlusIcon className="mr-2 h-4 w-4" />
                <span>Nova Tarefa</span>
              </SidebarMenuButton>
            </CreateTaskDialog>
          </SidebarMenuItem>
          
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild isActive={item.isActive}>
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
