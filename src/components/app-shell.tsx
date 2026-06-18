import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, LayoutDashboard, BookMarked, Settings, LogOut, Palmtree } from "lucide-react";
import type { ReactNode } from "react";

import { logout } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/bookings", label: "Bookings", icon: BookMarked },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Palmtree className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <p className="font-display text-base font-semibold tracking-tight text-sidebar-foreground">
          POLAM STAY
        </p>
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-sidebar-foreground/55">
          Booking Suite
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const doLogout = useServerFn(logout);

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await doLogout();
    await router.invalidate();
    navigate({ to: "/login", replace: true });
  }

  const navLinks = NAV.map(({ to, label, icon: Icon }) => (
    <Link
      key={to}
      to={to}
      activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
    >
      <Icon className="h-[1.15rem] w-[1.15rem]" />
      {label}
    </Link>
  ));

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar p-5 lg:flex">
        <div className="px-1 pb-6">
          <Brand />
        </div>
        <nav className="flex flex-1 flex-col gap-1">{navLinks}</nav>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="justify-start gap-3 text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-[1.15rem] w-[1.15rem]" /> Sign out
        </Button>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 lg:hidden">
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-sidebar/95 px-2 py-2 lg:hidden">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
