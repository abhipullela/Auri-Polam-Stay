export type EntryType = "booking" | "block";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type BlockReason = "maintenance" | "private_event" | "owner_use" | "other";

export interface Entry {
  id: string;
  type: EntryType;
  start_date: string; // YYYY-MM-DD (check-in)
  end_date: string; // YYYY-MM-DD (check-out, exclusive)
  guest_name: string | null;
  contact: string | null;
  payment_status: PaymentStatus;
  block_reason: BlockReason | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
};

export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  maintenance: "Maintenance",
  private_event: "Private event",
  owner_use: "Owner use",
  other: "Other",
};
