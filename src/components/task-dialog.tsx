"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createTask, updateTask } from "@/app/actions/tasks"
import { getWorkspaceMembers } from "@/app/actions/workspaces"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "next-intl"
import { format, parseISO } from "date-fns"
import { CalendarIcon, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

interface CurrentUser {
  id: string;
  name: string;
  avatar: string;
}

export function TaskDialog({
  children,
  task,
  workspaceId,
  currentUser,
}: {
  children: React.ReactNode;
  task?: any;
  workspaceId?: string;
  currentUser?: CurrentUser;
}) {
  const tTasks = useTranslations("Tasks")
  const tCommon = useTranslations("Common")
  const tFields = useTranslations("TaskFields")
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [tags, setTags] = React.useState<string[]>(task?.tags || [])
  const [tagInput, setTagInput] = React.useState("")
  const [date, setDate] = React.useState<Date | undefined>(
    task?.dueDate ? parseISO(task.dueDate) : undefined
  )
  
  // Members state
  const [members, setMembers] = React.useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);
  const [selectedMemberId, setSelectedMemberId] = React.useState<string>("");

  const isEdit = !!task;

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (open) {
      setTags(task?.tags || []);
      setDate(task?.dueDate ? parseISO(task.dueDate) : undefined);
      
      if (workspaceId) {
        setLoadingMembers(true);
        getWorkspaceMembers(workspaceId)
          .then(data => {
            const fetchedMembers = data || [];
            setMembers(fetchedMembers);
            
            // Re-select based on assignee name or active user
            let matchedId = "";
            if (task?.assignee) {
              const m = fetchedMembers.find(f => f.name === task.assignee);
              if (m) matchedId = m.id;
            }
            if (!matchedId && currentUser && !selectedMemberId) {
              const m = fetchedMembers.find(f => f.name === currentUser.name);
              if (m) matchedId = m.id;
            }
            setSelectedMemberId(matchedId);
          })
          .catch(console.error)
          .finally(() => setLoadingMembers(false));
      }
    }
  }, [open, task, workspaceId, currentUser]);

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput("");
    }
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter(t => t !== tagToRemove));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const status = formData.get("status") as string
    const priority = formData.get("priority") as string

    if (!title) {
      setLoading(false)
      return
    }

    try {
      const selectedMember = members.find(m => m.id === selectedMemberId) || null;

      const payload = {
        title,
        description: description || undefined,
        status: status || "Todo",
        priority: priority || "Medium",
        tags,
        assignee: selectedMember ? selectedMember.name : (currentUser?.name || "Me"),
        assigneeAvatar: selectedMember ? selectedMember.avatar : (currentUser?.avatar || undefined),
        dueDate: date ? format(date, "yyyy-MM-dd") : undefined
      };

      if (isEdit) {
         await updateTask(task.id, payload);
      } else {
         if (!workspaceId) throw new Error("Workspace ID is required");
         await createTask({ ...payload, workspaceId });
      }
      
      setTimeout(() => {
        setOpen(false)
        if (!isEdit) {
          setTags([])
          setTagInput("")
          setDate(undefined)
        }
        router.refresh()
        setLoading(false)
      }, 500)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? tTasks("editTask") || "Edit Task" : tTasks("addTask")}</DialogTitle>
          <DialogDescription>
            {isEdit ? tTasks("editTaskDescription") || "Edit task details." : tTasks("addTaskDescription") || "Fill in the details to add a new task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <Field>
            <FieldLabel htmlFor="title">{tTasks("titleLabel")}</FieldLabel>
            <Input id="title" name="title" defaultValue={task?.title || ""} placeholder={tTasks("titlePlaceholder") || "Task title..."} required disabled={loading} />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">{tTasks("descriptionLabel")}</FieldLabel>
            <textarea
              id="description"
              name="description"
              defaultValue={task?.description || ""}
              placeholder={tTasks("descriptionPlaceholder") || "Task description..."}
              disabled={loading}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
             <Field>
                <FieldLabel htmlFor="status">{tTasks("status")}</FieldLabel>
                <Select name="status" defaultValue={task?.status || "Todo"} disabled={loading}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder={tCommon("select") || "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todo">{tFields("Todo")}</SelectItem>
                    <SelectItem value="InProgress">{tFields("InProgress")}</SelectItem>
                    <SelectItem value="Review">{tFields("Review")}</SelectItem>
                    <SelectItem value="Done">{tFields("Done")}</SelectItem>
                  </SelectContent>
                </Select>
             </Field>
             <Field>
                <FieldLabel htmlFor="priority">{tTasks("priority")}</FieldLabel>
                <Select name="priority" defaultValue={task?.priority || "Medium"} disabled={loading}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder={tCommon("select") || "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">{tFields("Low")}</SelectItem>
                    <SelectItem value="Medium">{tFields("Medium")}</SelectItem>
                    <SelectItem value="High">{tFields("High")}</SelectItem>
                  </SelectContent>
                </Select>
             </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Field>
                <FieldLabel>{tTasks("assignee")}</FieldLabel>
                <Select
                  value={selectedMemberId}
                  onValueChange={setSelectedMemberId}
                  disabled={loading || loadingMembers}
                >
                  <SelectTrigger>
                    {loadingMembers ? (
                      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <SelectValue placeholder="Selecione..." />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-5">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-[10px]">
                              {member.name?.substring(0, 2).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {member.name} {member.id === currentUser?.id ? "(Você)" : ""}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {members.length === 0 && currentUser && (
                      <SelectItem value="fallback_current">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-5">
                            <AvatarImage src={currentUser.avatar} />
                            <AvatarFallback className="text-[10px]">
                              {currentUser.name?.substring(0, 2).toUpperCase() || "ME"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{currentUser.name} (Você)</span>
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
             </Field>
             <Field>
                <FieldLabel htmlFor="dueDate">{tTasks("dueDateLabel")}</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal pl-3",
                        !date && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      {date ? format(date, "PPP") : <span>{tTasks("chooseDate")}</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
             </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="tags">{tTasks("tags")}</FieldLabel>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="cursor-pointer font-normal rounded-md" onClick={() => removeTag(t)}>
                    {t} <span className="ml-1 text-muted-foreground">&times;</span>
                  </Badge>
                ))}
              </div>
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tTasks("tagsPlaceholder") || "Press enter to add tag..."}
                disabled={loading}
              />
            </div>
          </Field>
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? tCommon("save") + "..." : (isEdit ? tCommon("save") : tTasks("addTask"))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
