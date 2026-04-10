"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LanguageSwitcher } from "@/components/language-switcher";
import { signIn } from "next-auth/react";
import { resendVerificationCode } from "@/app/actions/verify-email";
import { OTP_LENGTH } from "@/lib/email/otp";

export function VerifyEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";

  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [resendCooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || value.length !== OTP_LENGTH) return;
    setLoading(true);

    const res = await signIn("credentials", {
      otpUserId: userId,
      otpCode: value,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      toast.error(res.code || res.error || "Erro ao validar código");
      return;
    }

    toast.success(t("verifySuccess"));
    router.push("/dashboard");
    router.refresh();
  }

  async function onResend() {
    if (!userId || resendCooldown > 0) return;
    const res = await resendVerificationCode(userId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(t("verifyResent"));
    setResendCooldown(60);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-0 p-0 shadow-lg shadow-primary/5">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <div className="mb-4 flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">{t("verifyTitle")}</h1>
                <p className="text-balance text-muted-foreground">
                  {t("verifyDescription")}
                </p>
              </div>
              {!userId && (
                <p className="text-center text-sm text-destructive">
                  {t("verifyMissingUser")}
                </p>
              )}
              <Field>
                <FieldLabel htmlFor="otp">{t("verifyCodeLabel")}</FieldLabel>
                <InputOTP
                  id="otp"
                  maxLength={OTP_LENGTH}
                  value={value}
                  onChange={setValue}
                  disabled={!userId || loading}
                  containerClassName="justify-center gap-2"
                >
                  <InputOTPGroup>
                    {Array.from({ length: OTP_LENGTH }, (_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>{t("verifyCodeHint")}</FieldDescription>
              </Field>
              <Field className="mt-2">
                <Button
                  type="submit"
                  disabled={
                    !userId || loading || value.length !== OTP_LENGTH
                  }
                  className="w-full"
                >
                  {loading ? "…" : t("verifySubmit")}
                </Button>
              </Field>
              <Field className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!userId || resendCooldown > 0}
                  onClick={onResend}
                >
                  {resendCooldown > 0
                    ? t("verifyResendWait", { seconds: resendCooldown })
                    : t("verifyResend")}
                </Button>
              </Field>
              <FieldDescription className="mt-6 text-center text-sm">
                <Link href="/" className="underline underline-offset-4 hover:text-primary">
                  {t("loginLink")}
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="mt-4 flex flex-col items-center justify-center gap-4 text-center text-xs text-muted-foreground">
        <div className="scale-90 opacity-70 transition-opacity hover:opacity-100">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
