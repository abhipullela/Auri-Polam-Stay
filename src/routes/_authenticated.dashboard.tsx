import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, BedDouble, Ban, CircleDollarSign, ArrowRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { useEntries } from "@/hooks/use-entries";
import { EntryDialog } from "@/components/entry-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fromKey, nightsBetween, toKey, MONTH_NAMES, entryCoversDay } from "@/lib/calendar-utils";
import { BLOCK_REASON_LABELS, PAYMENT_LABELS, type Entry } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — POLAM STAY" }] }),
  component: DashboardPage,
});

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function formatRange(e: Entry): string {
  const s = fromKey(e.start_date);
  const en = fromKey(e.end_date);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${s.toLocaleDateString(undefined, opts)} → ${en.toLocaleDateString(undefined, opts)}`;
}

function DashboardPage() {
  const { data: entries, isLoading } = useEntries();
  const [dialogOpen, setDialogOpen] = useState(false);

  const stats = useMemo(() => {
    const all = entries ?? [];
    const todayKey = toKey(new Date());
    const now = new Date();
    const monthStart = toKey(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = toKey(new Date(now.getFullYear(), now.getMonth() + 1, 1));

    const bookings = all.filter((e) => e.type === "booking");
    const blocks = all.filter((e) => e.type === "block");
    const upcoming = bookings
      .filter((e) => e.end_date > todayKey)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));

    let occupiedNights = 0;
    for (let d = fromKey(monthStart); toKey(d) < monthEnd; d.setDate(d.getDate() + 1)) {
      const k = toKey(d);
      if (bookings.some((e) => entryCoversDay(e, k))) occupiedNights++;
    }
    const totalNights = nightsBetween(monthStart, monthEnd);

    return {
      upcoming,
      activeBlocks: blocks.filter((e) => e.end_date > todayKey).length,
      unpaid: bookings.filter((e) => e.end_date > todayKey && e.payment_status !== "paid").length,
      occupiedNights,
      occupancy: Math.round((occupiedNights / totalNights) * 100),
    };
  }, [entries]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Welcome back
          </h1>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4" /> New entry
        </Button>
      </header>

      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <StatCard
              icon={CalendarDays}
              label="Occupancy"
              value={`${stats.occupancy}%`}
              hint={`${stats.occupiedNights} nights this month`}
            />
            <StatCard
              icon={BedDouble}
              label="Upcoming bookings"
              value={stats.upcoming.length}
              hint="From today onward"
            />
            <StatCard
              icon={Ban}
              label="Blocked periods"
              value={stats.activeBlocks}
              hint="Currently active or upcoming"
            />
            <StatCard
              icon={CircleDollarSign}
              label="Awaiting payment"
              value={stats.unpaid}
              hint="Unpaid or partial"
            />
          </>
        )}
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl font-semibold">Upcoming arrivals</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/calendar">
              Open calendar <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <Skeleton className="h-5 w-48" />
              </div>
            ))
          ) : stats.upcoming.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No upcoming bookings yet. Create your first one.
            </div>
          ) : (
            stats.upcoming.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{e.guest_name}</p>
                  <p className="text-sm text-muted-foreground">{formatRange(e)}</p>
                </div>
                <Badge
                  variant={e.payment_status === "paid" ? "default" : "secondary"}
                  className={
                    e.payment_status === "paid"
                      ? "bg-success text-success-foreground"
                      : e.payment_status === "partial"
                        ? "bg-warning text-warning-foreground"
                        : ""
                  }
                >
                  {PAYMENT_LABELS[e.payment_status]}
                </Badge>
              </div>
            ))
          )}
        </div>
      </section>

      <EntryDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={null} />
    </div>
  );
}

// keep import used for potential future block labels
void BLOCK_REASON_LABELS;
