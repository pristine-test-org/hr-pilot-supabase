import { NavLinks } from "@/components/dashboard/nav-links";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          HP
        </div>
        <span className="text-lg font-semibold">HR Pilot</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <NavLinks />
      </div>
      <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/50">
        HR Pilot &copy; {new Date().getFullYear()}
      </div>
    </aside>
  );
}
