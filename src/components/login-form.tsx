"use client"

import Link from "next/link"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LanguageSwitcher } from "@/components/language-switcher"
import { signIn } from "next-auth/react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("Auth")
  const router = useRouter()
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    })

    if (res?.error) {
      setError("Credenciais incorretas / Incorrect credentials")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg border-0 shadow-primary/5">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={onSubmit} className="p-6 md:p-8 flex flex-col justify-center">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">{t("welcome")}</h1>
                <p className="text-balance text-muted-foreground">
                  {t("loginDescription")}
                </p>
              </div>
              {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
              <Field>
                <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline text-muted-foreground"
                  >
                    {t("forgotPassword")}
                  </a>
                </div>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field className="mt-2">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "..." : t("loginButton")}
                </Button>
              </Field>
              
              <FieldDescription className="text-center mt-6 text-sm">
                {t("noAccount")} <Link href="/signup" className="underline underline-offset-4 hover:text-primary">{t("signUpLink")}</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:flex items-center justify-center bg-white dark:bg-zinc-950 p-12">
            <img
              src="/login-bg.png"
              alt="Login Illustration"
              className="absolute inset-0 h-full w-full object-contain p-12 dark:brightness-[0.8]"
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col items-center justify-center gap-4 text-center mt-4 text-xs text-muted-foreground">
        <div>
           {t("termsText")} <a href="#" className="underline">{t("terms")}</a> {t("and")} <a href="#" className="underline">{t("privacy")}</a>.
        </div>
        <div className="scale-90 opacity-70 hover:opacity-100 transition-opacity">
           <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
