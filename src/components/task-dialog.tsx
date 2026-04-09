"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createTask } from "@/app/actions/tasks"
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
import { useTranslations } from "next-intl"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateTask } from "@/app/actions/tasks"

export function TaskDialog({ children, task }: { children: React.ReactNode, task?: any }) {
  const tFields = useTranslations("TaskFields")
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [tags, setTags] = React.useState<string[]>(task?.tags || [])
  const [tagInput, setTagInput] = React.useState("")
  const [date, setDate] = React.useState<Date | undefined>(
    task?.dueDate ? parseISO(task.dueDate) : undefined
  )

  const isEdit = !!task;

  React.useEffect(() => {
    if (open) {
      setTags(task?.tags || []);
      setDate(task?.dueDate ? parseISO(task.dueDate) : undefined);
    }
  }, [open, task]);

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
    const status = formData.get("status") as string
    const priority = formData.get("priority") as string
    const assignee = formData.get("assignee") as string

    if (!title) {
      setLoading(false)
      return
    }

    try {
      const payload = {
        title,
        status: status || "Todo",
        priority: priority || "Medium",
        tags,
        assignee: assignee || "Eu",
        dueDate: date ? format(date, "yyyy-MM-dd") : undefined
      };

      if (isEdit) {
         await updateTask(task.id, payload);
      } else {
         await createTask(payload);
      }
      
      // Suave closing emulation
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Edite as informações da sua demanda do quadro." : "Preencha os dados abaixo para adicionar uma nova demanda ao quadro."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <Field>
            <FieldLabel htmlFor="title">Título da Tarefa</FieldLabel>
            <Input id="title" name="title" defaultValue={task?.title || ""} placeholder="Descreva sua tarefa aqui..." required disabled={loading} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
             <Field>
                <FieldLabel htmlFor="status">Status Definição</FieldLabel>
                <Select name="status" defaultValue={task?.status || "Todo"} disabled={loading}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione..." />
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
                <FieldLabel htmlFor="priority">Prioridade</FieldLabel>
                <Select name="priority" defaultValue={task?.priority || "Medium"} disabled={loading}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Selecione..." />
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
                <FieldLabel htmlFor="assignee">Responsável</FieldLabel>
                <Input id="assignee" name="assignee" defaultValue={task?.assignee || "Eu"} placeholder="Digite o nome..." disabled={loading} />
             </Field>
             <Field>
                <FieldLabel htmlFor="dueDate">Prazo de Entrega</FieldLabel>
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
                      {date ? format(date, "PPP") : <span>Escolha a data</span>}
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
            <FieldLabel htmlFor="tags">Tags</FieldLabel>
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
                placeholder="Pressione Enter ou vírgula para registrar a label..."
                disabled={loading}
              />
            </div>
          </Field>
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : (isEdit ? "Aplicar Mudanças" : "Criar Tarefa")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
