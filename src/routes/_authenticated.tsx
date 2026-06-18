import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

import { getAuthStatus } from "@/lib/auth.functions";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const status = await getAuthStatus();
    if (!status.authed) throw redirect({ to: "/login" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
