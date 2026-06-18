import { useEffect, useState } from "react";
import { Trash2, BedDouble, Ban } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { addDays, nightsBetween, toKey } from "@/lib/calendar-utils";
import { useEntryMutations } from "@/hooks/use-entries";
import type { BlockReason, Entry, EntryType, PaymentStatus } from "@/lib/types";

interface EntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Entry | null;
  defaultStart?: string;
  defaultType?: EntryType;
}

interface FormState {
  type: EntryType;
  start_date: string;
  end_date: string;
  guest_name: string;
  contact: string;
  payment_status: PaymentStatus;
  block_reason: BlockReason;
  notes: string;
}

function buildInitial(
  entry: Entry | null,
  defaultStart?: string,
  defaultType: EntryType = "booking",
): FormState {
  if (entry) {
    return {
      type: entry.type,
      start_date: entry.start_date,
      end_date: entry.end_date,
      guest_name: entry.guest_name ?? "",
      contact: entry.contact ?? "",
      payment_status: entry.payment_status,
      block_reason: entry.block_reason ?? "maintenance",
      notes: entry.notes ?? "",
    };
  }
  const start = defaultStart ?? toKey(new Date());
  return {
    type: defaultType,
    start_date: start,
    end_date: toKey(addDays(new Date(start.split("-").map(Number).join("/")), 1)),
    guest_name: "",
    contact: "",
    payment_status: "unpaid",
    block_reason: "maintenance",
    notes: "",
  };
}

export function EntryDialog({
  open,
  onOpenChange,
  entry,
  defaultStart,
  defaultType,
}: EntryDialogProps) {
  const [form, setForm] = useState<FormState>(() => buildInitial(entry, defaultStart, defaultType));
  const { createMutation, updateMutation, deleteMutation } = useEntryMutations();
  const isEditing = !!entry;
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) setForm(buildInitial(entry, defaultStart, defaultType));
  }, [open, entry, defaultStart, defaultType]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const nights =
    form.end_date > form.start_date ? nightsBetween(form.start_date, form.end_date) : 0;

  async function handleSave() {
    const payload = {
      ...(isEditing ? { id: entry!.id } : {}),
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
      guest_name: form.type === "booking" ? form.guest_name.trim() : null,
      contact: form.type === "booking" ? form.contact.trim() || null : null,
      payment_status: form.type === "booking" ? form.payment_status : "unpaid",
      block_reason: form.type === "block" ? form.block_reason : null,
      notes: form.notes.trim() || null,
    };
    try {
      if (isEditing) await updateMutation.mutateAsync(payload);
      else await createMutation.mutateAsync(payload);
      onOpenChange(false);
    } catch {
      /* error toast handled in mutation */
    }
  }

  async function handleDelete() {
    if (!entry) return;
    try {
      await deleteMutation.mutateAsync(entry.id);
      onOpenChange(false);
    } catch {
      /* handled */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isEditing ? "Edit entry" : "New entry"}
          </DialogTitle>
          <DialogDescription>
            {form.type === "booking"
              ? "Reserve dates for a guest. Overlapping dates are blocked automatically."
              : "Block dates for maintenance, private events, or owner use."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Type switch */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => set("type", "booking")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                form.type === "booking"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              <BedDouble className="h-4 w-4" /> Booking
            </button>
            <button
              type="button"
              onClick={() => set("type", "block")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                form.type === "block"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              <Ban className="h-4 w-4" /> Blocked
            </button>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start">Check-in</Label>
              <Input
                id="start"
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">Check-out</Label>
              <Input
                id="end"
                type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={(e) => set("end_date", e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {nights > 0 ? `${nights} night${nights > 1 ? "s" : ""}` : "Check-out must be after check-in"}
          </p>

          {form.type === "booking" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="guest">Guest name</Label>
                <Input
                  id="guest"
                  value={form.guest_name}
                  placeholder="e.g. Aman Sharma"
                  onChange={(e) => set("guest_name", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="contact">Phone / email</Label>
                  <Input
                    id="contact"
                    value={form.contact}
                    placeholder="Optional"
                    onChange={(e) => set("contact", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment</Label>
                  <Select
                    value={form.payment_status}
                    onValueChange={(v) => set("payment_status", v as PaymentStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select
                value={form.block_reason}
                onValueChange={(v) => set("block_reason", v as BlockReason)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="private_event">Private event</SelectItem>
                  <SelectItem value="owner_use">Owner use</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              placeholder="Optional details"
              rows={2}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {isEditing ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes it from the calendar. This can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || nights <= 0}>
              {saving ? "Saving…" : isEditing ? "Save changes" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
