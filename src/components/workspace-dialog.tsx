"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createWorkspace, updateWorkspace } from "@/app/actions/workspaces"
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
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

interface WorkspaceDialogProps {
  children: React.ReactNode;
  workspace?: {
    id: string;
    name: string;
    description: string | null;
  };
}

export function WorkspaceDialog({ children, workspace }: WorkspaceDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isEdit = !!workspace;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    if (!name.trim()) {
      setLoading(false)
      return
    }

    try {
      if (isEdit) {
        await updateWorkspace(workspace.id, { name, description })
        toast.success("Workspace atualizado!")
      } else {
        const result = await createWorkspace({ name, description })
        toast.success("Workspace criado!")
        // Navigate to the new workspace
        if (result?.id) {
          router.push(`/dashboard/${result.id}`)
        }
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error("Erro ao salvar workspace")
    } finally {
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Workspace" : "Novo Workspace"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize as informações do seu workspace."
              : "Crie um novo espaço de trabalho para organizar suas tarefas."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <Field>
            <FieldLabel htmlFor="ws-name">Nome</FieldLabel>
            <Input
              id="ws-name"
              name="name"
              defaultValue={workspace?.name || ""}
              placeholder="Ex: Projeto Alpha, Estudos, Pessoal..."
              required
              disabled={loading}
              className="h-10"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="ws-description">Descrição (opcional)</FieldLabel>
            <Input
              id="ws-description"
              name="description"
              defaultValue={workspace?.description || ""}
              placeholder="Uma breve descrição do workspace..."
              disabled={loading}
              className="h-10"
            />
          </Field>
          <div className="flex justify-end mt-2">
            <Button type="submit" disabled={loading} className="min-w-[140px]">
              {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar Alterações" : "Criar Workspace"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
