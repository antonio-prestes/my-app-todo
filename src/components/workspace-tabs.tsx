"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { LayoutListIcon, KanbanSquareIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function WorkspaceTabs({ workspaceId }: { workspaceId: string }) {
  const searchParams = useSearchParams()
  const isKanban = searchParams.get("view") === "kanban"

  const tabs = [
    {
      label: "Tabela",
      href: `/dashboard/${workspaceId}`,
      icon: LayoutListIcon,
      active: !isKanban,
    },
    {
      label: "Kanban",
      href: `/dashboard/${workspaceId}?view=kanban`,
      icon: KanbanSquareIcon,
      active: isKanban,
    },
  ]

  return (
    <div className="flex items-center gap-1 border-b px-4 lg:px-6">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab.active
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          )}
        >
          <tab.icon className="size-4" />
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
