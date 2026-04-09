import Link from "next/link"
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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("Auth")

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
          <form className="p-6 md:p-8 flex flex-col justify-center">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">{t("createAccount")}</h1>
                <p className="text-balance text-muted-foreground">
                  {t("signUpDescription")}
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="name">{t("name")}</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                <Input id="password" type="password" />
              </Field>
              <Field className="mt-2">
                <Button type="button" asChild className="w-full">
                  <Link href="/dashboard">{t("signUpButton")}</Link>
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
