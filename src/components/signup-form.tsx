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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LanguageSwitcher } from "@/components/language-switcher"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { CheckIcon, XIcon } from "lucide-react"

// --- Password Strength Logic ---
function getPasswordStrength(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 10) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  return score // 0 to 5
}

const strengthColors = [
  "bg-zinc-300 dark:bg-zinc-700",    // 0 - empty
  "bg-red-500",                       // 1 - very weak
  "bg-orange-500",                    // 2 - weak
  "bg-yellow-500",                    // 3 - fair
  "bg-emerald-500",                   // 4 - strong
  "bg-green-500",                     // 5 - very strong
]

function PasswordStrengthMeter({ password }: { password: string }) {
  const t = useTranslations("Auth")
  const strength = getPasswordStrength(password)

  const labels = [
    "",
    t("strengthVeryWeak"),
    t("strengthWeak"),
    t("strengthFair"),
    t("strengthStrong"),
    t("strengthVeryStrong"),
  ]

  const textColors = [
    "text-zinc-400",
    "text-red-500",
    "text-orange-500",
    "text-yellow-600 dark:text-yellow-400",
    "text-emerald-500",
    "text-green-500",
  ]

  if (!password) return null

  return (
    <div className="flex flex-col gap-1.5 mt-1.5">
      <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "flex-1 rounded-full transition-all duration-300",
              strength >= level
                ? strengthColors[strength]
                : "bg-zinc-200 dark:bg-zinc-800"
            )}
          />
        ))}
      </div>
      <span className={cn("text-xs font-medium transition-colors", textColors[strength])}>
        {labels[strength]}
      </span>
    </div>
  )
}

// --- Signup Form ---
export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("Auth")
  const router = useRouter()
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const supabase = createClient()

  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"))
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
        },
      },
    })

    if (signUpError) {
      if (signUpError.message === "User already registered" || signUpError.message.includes("already registered")) {
        setError(t("emailAlreadyRegistered"))
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
    } else if (data?.user && data.user.identities && data.user.identities.length === 0) {
      setError(t("emailAlreadyRegistered"))
      setLoading(false)
    } else {
      toast.success(t("confirmEmailMessage") || "Check your email for the confirmation link!")
      router.push("/") // Redirect to login or a "Check email" page
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg border-0 shadow-primary/5">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Image block is FIRST here to display on the left side of the grid */}
          <div className="relative hidden bg-muted md:flex items-center justify-center bg-white dark:bg-zinc-950 p-12 border-r">
            <img
              src="/sign-up-bg.png"
              alt="Sign Up Illustration"
              className="absolute inset-0 h-full w-full object-contain p-12 dark:brightness-[0.8]"
            />
          </div>
          <form onSubmit={onSubmit} className="p-6 md:p-8 flex flex-col justify-center">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">{t("createAccount")}</h1>
                <p className="text-balance text-muted-foreground">
                  {t("signUpDescription")}
                </p>
              </div>
              {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
              <Field>
                <FieldLabel htmlFor="name">{t("name")}</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                />
              </Field>
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
                <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordStrengthMeter password={password} />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword" className="flex items-center gap-2">
                  {t("confirmPassword")}
                  {confirmPassword.length > 0 && (
                    passwordsMatch ? (
                      <CheckIcon className="size-4 text-green-500" />
                    ) : (
                      <XIcon className="size-4 text-red-500" />
                    )
                  )}
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    confirmPassword.length > 0 && !passwordsMatch && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1">{t("passwordMismatch")}</p>
                )}
              </Field>
              <Field className="mt-2">
                <Button
                  type="submit"
                  disabled={loading || !passwordsMatch || password.length === 0}
                  className="w-full"
                >
                  {loading ? "..." : t("signUpButton")}
                </Button>
              </Field>
              
              <FieldDescription className="text-center mt-6 text-sm">
                {t("haveAccount")} <Link href="/" className="underline underline-offset-4 hover:text-primary">{t("loginLink")}</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
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
