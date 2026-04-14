"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createWorkspace, updateWorkspace, inviteUser } from "@/app/actions/workspaces"
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
import { Loader2Icon, SmileIcon, UserIcon, SendIcon, CheckCircleIcon } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { EmojiPicker } from "@/components/emoji-picker"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface WorkspaceDialogProps {
  children: React.ReactNode;
  workspace?: {
    id: string;
    name: string;
    description: string | null;
    emoji?: string | null;
  };
  currentUser?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
}

export function WorkspaceDialog({ children, workspace, currentUser }: WorkspaceDialogProps) {
  const router = useRouter()
  const t = useTranslations("Workspace")
  const tc = useTranslations("Common")
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  
  const [step, setStep] = React.useState<1 | 2>(1)
  const [createdWorkspaceId, setCreatedWorkspaceId] = React.useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviting, setInviting] = React.useState(false)

  const [selectedEmoji, setSelectedEmoji] = React.useState(workspace?.emoji || "📁")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isEdit = !!workspace;

  // Reset state when opening/closing
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setCreatedWorkspaceId(null);
        setInviteEmail("");
      }, 300);
    }
  }, [open]);

  async function onSubmitStep1(e: React.FormEvent<HTMLFormElement>) {
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
        setOpen(false)
      } else {
        const result = await createWorkspace({ name, description, emoji })
        toast.success(t("createSuccess") || "Workspace created!")
        if (result?.id) {
          setCreatedWorkspaceId(result.id)
          setStep(2) // Move to step 2 instead of closing
        }
      }
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(t("saveError") || "Error saving workspace")
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const targetWsId = isEdit ? workspace?.id : createdWorkspaceId;
    if (!targetWsId || !inviteEmail.trim()) return;

    setInviting(true)
    try {
      await inviteUser(targetWsId, inviteEmail)
      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteEmail("")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error sending invite")
    } finally {
      setInviting(false)
    }
  }

  const handleFinish = () => {
    const wsId = isEdit ? workspace?.id : createdWorkspaceId;
    if (wsId && !isEdit) {
      router.push(`/dashboard/${wsId}`)
    }
    setOpen(false);
  };

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
            {step === 1 
              ? (isEdit ? (t("editDescription") || "Update your workspace info.") : (t("createDescription") || "Create a new workspace to organize your tasks."))
              : "Invite team members to collaborate on this workspace."
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={onSubmitStep1} className="grid gap-6 py-4">
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
                {isEdit ? tc("save") : (t("next") || "Continuar")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium">Membros da Equipe</h3>
              
              {/* Creator / Owner */}
              <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border">
                 <Avatar className="h-9 w-9 border">
                   {currentUser?.avatar ? (
                     <AvatarImage src={currentUser.avatar} />
                   ) : (
                     <AvatarFallback className="bg-primary/5">
                       <UserIcon className="size-4 text-muted-foreground" />
                     </AvatarFallback>
                   )}
                 </Avatar>
                 <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium leading-none">{currentUser?.name || "Você"}</span>
                    <span className="text-xs text-muted-foreground mt-1">{currentUser?.email || ""}</span>
                 </div>
                 <div className="text-xs font-semibold uppercase tracking-wider text-primary border border-primary/20 bg-primary/10 px-2 py-0.5 rounded-full mr-2">
                   Owner
                 </div>
              </div>

              {/* Invite Form */}
              <form onSubmit={handleInvite} className="flex gap-2 items-center mt-2">
                <Input 
                  type="email" 
                  placeholder="E-mail do convidado..." 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={inviting || !inviteEmail} size="icon">
                  {inviting ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
                </Button>
              </form>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={handleFinish} className="min-w-[140px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
                <CheckCircleIcon className="mr-2 size-4" /> Finalizar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
