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
import { Loader2Icon, SmileIcon } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { EmojiPicker } from "@/components/emoji-picker"

interface WorkspaceDialogProps {
  children: React.ReactNode;
  workspace?: {
    id: string;
    name: string;
    description: string | null;
    emoji?: string | null;
  };
}

export function WorkspaceDialog({ children, workspace }: WorkspaceDialogProps) {
  const router = useRouter()
  const t = useTranslations("Workspace")
  const tc = useTranslations("Common")
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [selectedEmoji, setSelectedEmoji] = React.useState(workspace?.emoji || "📁")

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
    const emoji = formData.get("emoji") as string

    if (!name.trim()) {
      setLoading(false)
      return
    }

    try {
      if (isEdit) {
        await updateWorkspace(workspace.id, { name, description, emoji })
        toast.success(t("editSuccess") || "Workspace updated!")
      } else {
        const result = await createWorkspace({ name, description, emoji })
        toast.success(t("createSuccess") || "Workspace created!")
        // Navigate to the new workspace
        if (result?.id) {
          router.push(`/dashboard/${result.id}`)
        }
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(t("saveError") || "Error saving workspace")
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
          <DialogTitle>{isEdit ? t("edit") : t("newWorkspace")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("editDescription") || "Update your workspace info."
              : t("createDescription") || "Create a new workspace to organize your tasks."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-6 py-4">
          <div className="flex flex-col items-center justify-center gap-4 py-2">
            <EmojiPicker
              value={selectedEmoji}
              onChange={(emoji) => setSelectedEmoji(emoji)}
            >
              <button type="button" className="relative group focus:outline-none">
                <div className="size-24 rounded-3xl bg-primary/10 flex items-center justify-center text-5xl shadow-inner border-2 border-primary/20 group-hover:bg-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                  {selectedEmoji}
                  <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground size-8 rounded-full flex items-center justify-center border-4 border-background shadow-lg group-hover:bg-primary/90">
                    <SmileIcon className="size-4" />
                  </div>
                </div>
                <input type="hidden" name="emoji" value={selectedEmoji} />
              </button>
            </EmojiPicker>
            <p className="text-xs text-muted-foreground font-medium">{t("clickToChangeIcon")}</p>
          </div>

          <Field>
            <FieldLabel htmlFor="ws-name">{t("nameLabel")}</FieldLabel>
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
            <FieldLabel htmlFor="ws-description">{t("descriptionLabel")}</FieldLabel>
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
              {isEdit ? tc("save") : t("create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
