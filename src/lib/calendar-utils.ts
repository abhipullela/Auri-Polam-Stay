import type { Entry } from "./types";

/** Format a Date as a local YYYY-MM-DD key (no timezone shift). */
export function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD key into a local Date at midnight. */
export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function nightsBetween(startKey: string, endKey: string): number {
  const ms = fromKey(endKey).getTime() - fromKey(startKey).getTime();
  return Math.round(ms / 86_400_000);
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface GridDay {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
}

/** Build a 6-row (42 cell) month grid starting on Sunday. */
export function buildMonthGrid(year: number, month: number): GridDay[] {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  const todayKey = toKey(new Date());
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(start, i);
    return {
      date,
      key: toKey(date),
      inMonth: date.getMonth() === month,
      isToday: toKey(date) === todayKey,
    };
  });
}

/** True when the given day falls within the entry's [start, end) range. */
export function entryCoversDay(entry: Entry, dayKey: string): boolean {
  return dayKey >= entry.start_date && dayKey < entry.end_date;
}

/** Entries active on a given day (checkout day excluded). */
export function entriesOnDay(entries: Entry[], dayKey: string): Entry[] {
  return entries.filter((e) => entryCoversDay(e, dayKey));
}
