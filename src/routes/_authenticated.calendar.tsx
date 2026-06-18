import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus, BedDouble, Ban } from "lucide-react";
import { useMemo, useState } from "react";

import { useEntries } from "@/hooks/use-entries";
import { EntryDialog } from "@/components/entry-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  buildMonthGrid,
  entriesOnDay,
  MONTH_NAMES,
  WEEKDAYS,
  toKey,
} from "@/lib/calendar-utils";
import type { Entry } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — POLAM STAY" }] }),
  component: CalendarPage,
});

function chipClasses(entry: Entry): string {
  if (entry.type === "block") {
    return "bg-muted text-muted-foreground border border-dashed border-muted-foreground/40";
  }
  switch (entry.payment_status) {
    case "paid":
      return "bg-success/15 text-success border border-success/30";
    case "partial":
      return "bg-warning/20 text-warning-foreground border border-warning/40";
    default:
      return "bg-primary/12 text-primary border border-primary/25";
  }
}

function CalendarPage() {
  const { data: entries, isLoading } = useEntries();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [defaultStart, setDefaultStart] = useState<string>(toKey(now));

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const list = entries ?? [];

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function openNew(startKey: string) {
    setEditing(null);
    setDefaultStart(startKey);
    setDialogOpen(true);
  }

  function openEdit(entry: Entry) {
    setEditing(entry);
    setDialogOpen(true);
  }

  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            {MONTH_NAMES[month]} <span className="text-muted-foreground">{year}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => openNew(toKey(now))}>
            <Plus className="h-4 w-4" /> New entry
          </Button>
        </div>
      </header>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/40" /> Booking
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-success/50" /> Paid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-warning/60" /> Partial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-muted-foreground/60" /> Blocked
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="mt-5 h-[560px] w-full rounded-xl" />
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((day) => {
              const dayEntries = entriesOnDay(list, day.key);
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => openNew(day.key)}
                  className={cn(
                    "group relative min-h-[5.5rem] border-b border-r border-border p-1.5 text-left align-top transition-colors hover:bg-accent/40 sm:min-h-[7rem]",
                    !day.inMonth && "bg-muted/30",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      day.isToday
                        ? "bg-primary text-primary-foreground"
                        : day.inMonth
                          ? "text-foreground"
                          : "text-muted-foreground/50",
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEntries.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openEdit(e);
                        }}
                        className={cn(
                          "flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[0.7rem] font-medium leading-tight",
                          chipClasses(e),
                        )}
                      >
                        {e.type === "block" ? (
                          <Ban className="h-3 w-3 shrink-0" />
                        ) : (
                          <BedDouble className="h-3 w-3 shrink-0" />
                        )}
                        <span className="truncate">
                          {e.type === "block" ? "Blocked" : e.guest_name}
                        </span>
                      </span>
                    ))}
                    {dayEntries.length > 3 && (
                      <span className="block px-1 text-[0.68rem] text-muted-foreground">
                        +{dayEntries.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <EntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
        defaultStart={defaultStart}
      />
    </div>
  );
}
