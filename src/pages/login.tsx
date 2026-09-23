import { Navigate, useSearchParams } from "react-router";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { profile, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const redirectTo = from?.startsWith("/dashboard") ? from : "/dashboard";

  if (!loading && profile) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
