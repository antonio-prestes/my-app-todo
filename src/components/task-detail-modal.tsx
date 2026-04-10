"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "next-intl"
import { CircleIcon, ClockIcon, FlagIcon, UserIcon, HashIcon, AlignLeftIcon } from "lucide-react"

function getStatusIcon(status: string) {
  switch (status) {
    case "Done": return <CircleIcon className="size-4 fill-green-500 text-green-500" />
    case "InProgress": return <CircleIcon className="size-4 fill-blue-500 text-blue-500" />
    case "Review": return <CircleIcon className="size-4 fill-yellow-500 text-yellow-500" />
    default: return <CircleIcon className="size-4 text-muted-foreground" />
  }
}

function PriorityChip({ priority }: { priority: string }) {
  const tFields = useTranslations("TaskFields")
  const config: Record<string, { bg: string; text: string }> = {
    High: { bg: "bg-red-100 dark:bg-red-500/20", text: "text-red-700 dark:text-red-400" },
    Medium: { bg: "bg-amber-100 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-400" },
    Low: { bg: "bg-blue-100 dark:bg-blue-500/20", text: "text-blue-700 dark:text-blue-400" },
  }
  const c = config[priority] || config.Medium
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {tFields(priority)}
    </span>
  )
}

interface TaskDetailModalProps {
  task: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const tTasks = useTranslations("Tasks")
  const tFields = useTranslations("TaskFields")

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold pr-6">{task.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5 py-2">
          {/* Description */}
          {task.description && (
            <div className="flex flex-col gap-1.5">
              <div className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                <AlignLeftIcon className="size-4" /> Descrição
              </div>
              <p className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
                {task.description}
              </p>
            </div>
          )}

          {/* Properties Grid */}
          <div className="grid gap-4">
            {/* Status */}
            <div className="flex items-center gap-4">
              <div className="w-28 text-sm text-muted-foreground flex items-center gap-2">
                <CircleIcon className="size-4" /> {tTasks("status")}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                {getStatusIcon(task.status)}
                {tFields(task.status)}
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-4">
              <div className="w-28 text-sm text-muted-foreground flex items-center gap-2">
                <FlagIcon className="size-4" /> {tTasks("priority")}
              </div>
              <PriorityChip priority={task.priority} />
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-4">
              <div className="w-28 text-sm text-muted-foreground flex items-center gap-2">
                <UserIcon className="size-4" /> {tTasks("assignee")}
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarImage src={task.assigneeAvatar} alt={task.assignee} />
                  <AvatarFallback className="text-xs">
                    {task.assignee?.substring(0, 2)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{task.assignee || "Não atribuído"}</span>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-4">
              <div className="w-28 text-sm text-muted-foreground flex items-center gap-2">
                <ClockIcon className="size-4" /> {tTasks("dueDate")}
              </div>
              <span className="text-sm font-medium">{task.dueDate || "—"}</span>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-start gap-4">
                <div className="w-28 text-sm text-muted-foreground flex items-center gap-2 pt-0.5">
                  <HashIcon className="size-4" /> {tTasks("tags")}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {task.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="font-normal">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { PriorityChip }
