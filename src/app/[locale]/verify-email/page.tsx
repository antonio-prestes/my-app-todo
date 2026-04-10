import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/20 p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground">…</div>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
