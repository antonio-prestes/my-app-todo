"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from "@/components/ui/card"
import { Loader2Icon, MailOpenIcon } from "lucide-react"

export function InviteOverlay() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const handleAction = (path: string) => {
    setLoading(true)
    router.push(path)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Heavy Blur Background */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-md" />
      
      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-primary">
            <MailOpenIcon className="size-8" />
          </div>
          <CardTitle className="text-2xl">Você foi convidado!</CardTitle>
          <CardDescription className="text-base mt-2">
            Para acessar e colaborar neste workspace, você precisa entrar na sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-4">
          <Button 
            size="lg" 
            onClick={() => handleAction("/?signup=true")}
            disabled={loading}
          >
            {loading ? <Loader2Icon className="mr-2 animate-spin size-4" /> : "Criar uma conta"}
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => handleAction("/")}
            disabled={loading}
          >
            Entrar na minha conta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
