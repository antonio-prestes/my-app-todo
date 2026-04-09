import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/20 p-6 md:p-10">
      <div className="w-full max-w-4xl">
        <SignupForm />
      </div>
    </div>
  )
}
