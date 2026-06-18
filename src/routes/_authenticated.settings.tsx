import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, Database, Loader2 } from "lucide-react";

import { changePassword } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — POLAM STAY" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const doChange = useServerFn(changePassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("New passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      await doChange({ data: { current, next } });
      toast.success("Team password updated.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage access and review how POLAM STAY keeps your bookings safe.
        </p>
      </header>

      <section className="mt-7 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/12 text-primary">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold">Team password</h2>
            <p className="text-sm text-muted-foreground">
              Everyone on your team signs in with this shared password.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="next">New password</Label>
              <Input
                id="next"
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={saving || !current || !next}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <ShieldCheck className="h-6 w-6 text-success" />
          <h3 className="mt-3 font-semibold text-foreground">Clash-free guarantee</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The database rejects any booking or block that overlaps existing dates — double bookings
            are impossible.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <Database className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-semibold text-foreground">Live shared data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All devices read from one central database and refresh automatically, so everyone always
            sees the latest calendar.
          </p>
        </div>
      </section>
    </div>
  );
}
