import { Suspense } from "react";

import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { AuthPageShell } from "@/components/auth/layout/AuthPageShell";
import { Typography } from "@/components/ui/typography";

function VerifyEmailFallback() {
  return (
    <AuthPageShell
      title="Check Your Email"
      description="Loading password reset details..."
    >
      <Typography variant="muted">Please wait...</Typography>
    </AuthPageShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
