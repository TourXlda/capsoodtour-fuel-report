import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginFrom";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
