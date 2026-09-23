import { createBrowserRouter, RouterProvider } from "react-router";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import NotFoundPage from "@/pages/not-found";
import DashboardLayout from "@/pages/dashboard/layout";
import DashboardOverviewPage from "@/pages/dashboard/overview";
import LeavesPage from "@/pages/dashboard/leaves";
import PayrollPage from "@/pages/dashboard/payroll";
import ClaimsPage from "@/pages/dashboard/claims";
import SettingsPage from "@/pages/dashboard/settings";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardOverviewPage /> },
      { path: "leaves", element: <LeavesPage /> },
      { path: "payroll", element: <PayrollPage /> },
      { path: "claims", element: <ClaimsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
