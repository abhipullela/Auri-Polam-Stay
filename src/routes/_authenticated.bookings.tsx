import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, BedDouble, Ban, Pencil } from "lucide-react";
import { useMemo, useState } from "react";

import { useEntries } from "@/hooks/use-entries";
import { EntryDialog } from "@/components/entry-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fromKey, nightsBetween, toKey } from "@/lib/calendar-utils";
import { BLOCK_REASON_LABELS, PAYMENT_LABELS, type Entry } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({ meta: [{ title: "Bookings — POLAM STAY" }] }),
  component: BookingsPage,
});

type Filter = "all" | "booking" | "block" | "upcoming";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "booking", label: "Bookings" },
  { key: "block", label: "Blocked" },
];

function dateLabel(key: string) {
  return fromKey(key).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BookingsPage() {
  const { data: entries, isLoading } = useEntries();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);

  const rows = useMemo(() => {
    const todayKey = toKey(new Date());
    let list = [...(entries ?? [])];
    if (filter === "booking") list = list.filter((e) => e.type === "booking");
    else if (filter === "block") list = list.filter((e) => e.type === "block");
    else if (filter === "upcoming") list = list.filter((e) => e.end_date > todayKey);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          (e.guest_name ?? "").toLowerCase().includes(q) ||
          (e.contact ?? "").toLowerCase().includes(q) ||
          (e.notes ?? "").toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.start_date.localeCompare(a.start_date));
  }, [entries, filter, query]);

  function openEdit(e: Entry) {
    setEditing(e);
    setDialogOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage every reservation and blocked period in one place.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New entry
        </Button>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guest, contact…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-muted-foreground">
            No entries found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/30 sm:px-5"
              >
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                    e.type === "block"
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/12 text-primary",
                  )}
                >
                  {e.type === "block" ? (
                    <Ban className="h-5 w-5" />
                  ) : (
                    <BedDouble className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {e.type === "block"
                      ? `Blocked · ${BLOCK_REASON_LABELS[e.block_reason ?? "other"]}`
                      : e.guest_name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {dateLabel(e.start_date)} → {dateLabel(e.end_date)} ·{" "}
                    {nightsBetween(e.start_date, e.end_date)} night
                    {nightsBetween(e.start_date, e.end_date) > 1 ? "s" : ""}
                    {e.contact ? ` · ${e.contact}` : ""}
                  </p>
                </div>
                {e.type === "booking" && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "hidden shrink-0 sm:inline-flex",
                      e.payment_status === "paid" && "bg-success text-success-foreground",
                      e.payment_status === "partial" && "bg-warning text-warning-foreground",
                    )}
                  >
                    {PAYMENT_LABELS[e.payment_status]}
                  </Badge>
                )}
                <Button variant="ghost" size="icon" onClick={() => openEdit(e)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <EntryDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} />
    </div>
  );
}
