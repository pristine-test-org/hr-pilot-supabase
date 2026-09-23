import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, CalendarDays, Wallet, Receipt, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/leaves", label: "Leaves", icon: CalendarDays },
  { href: "/dashboard/payroll", label: "Payroll", icon: Wallet },
  { href: "/dashboard/claims", label: "Claims", icon: Receipt },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];
