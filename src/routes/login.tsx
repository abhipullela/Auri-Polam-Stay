import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Palmtree, Loader2 } from "lucide-react";

import { getAuthStatus, login } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const status = await getAuthStatus();
    if (status.authed) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [{ title: "Sign in — POLAM STAY" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const doLogin = useServerFn(login);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await doLogin({ data: { password } });
      await router.invalidate();
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-sidebar px-4">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.5]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-lift)]">
            <Palmtree className="h-7 w-7" />
          </span>
          <h1 className="font-display text-3xl font-semibold text-sidebar-foreground">POLAM STAY</h1>
          <p className="mt-1 text-sm text-sidebar-foreground/60">Resort booking calendar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-sidebar-border bg-card p-6 shadow-[var(--shadow-lift)]"
        >
          <div className="space-y-1.5">
            <Label htmlFor="password">Team password</Label>
            <Input
              id="password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter shared password"
            />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading || !password}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
