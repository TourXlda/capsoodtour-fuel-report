import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthPageShell } from "@/components/auth/layout/AuthPageShell";
import { Typography } from "@/components/ui/typography";

function ResetPasswordFallback() {
  return (
    <AuthPageShell
      title="Reset Password"
      description="Preparing password reset..."
    >
      <Typography variant="muted">Please wait...</Typography>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
