import { Navigate, Outlet, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout() {
  const { profile, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to={`/login?from=${encodeURIComponent(pathname)}`} replace />;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar user={profile} />
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
