import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Entry } from "./types";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

const baseSchema = z
  .object({
    type: z.enum(["booking", "block"]),
    start_date: dateStr,
    end_date: dateStr,
    guest_name: z.string().trim().max(160).optional().nullable(),
    contact: z.string().trim().max(160).optional().nullable(),
    payment_status: z.enum(["unpaid", "partial", "paid"]).default("unpaid"),
    block_reason: z.enum(["maintenance", "private_event", "owner_use", "other"]).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((d) => d.end_date > d.start_date, {
    message: "Check-out must be after check-in.",
    path: ["end_date"],
  })
  .refine((d) => d.type !== "booking" || !!d.guest_name, {
    message: "Guest name is required for a booking.",
    path: ["guest_name"],
  });

async function requireAuth() {
  const { getAppSession } = await import("./auth.server");
  const session = await getAppSession();
  if (session.data.authed !== true) {
    throw new Error("You must be signed in.");
  }
}

const CLASH_MESSAGE =
  "These dates clash with an existing booking or blocked period. Pick different dates.";

export const listEntries = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();
  const { ensureSchema, getSql } = await import("./db.server");
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, type, to_char(start_date, 'YYYY-MM-DD') AS start_date,
           to_char(end_date, 'YYYY-MM-DD') AS end_date,
           guest_name, contact, payment_status, block_reason, notes,
           created_at, updated_at
    FROM entries
    ORDER BY start_date ASC
  `) as Entry[];
  return rows;
});

export const createEntry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => baseSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { ensureSchema, getSql, isExclusionViolation } = await import("./db.server");
    await ensureSchema();
    const sql = getSql();
    try {
      const rows = (await sql`
        INSERT INTO entries (type, start_date, end_date, guest_name, contact, payment_status, block_reason, notes)
        VALUES (${data.type}, ${data.start_date}, ${data.end_date},
                ${data.guest_name ?? null}, ${data.contact ?? null},
                ${data.payment_status}, ${data.block_reason ?? null}, ${data.notes ?? null})
        RETURNING id
      `) as { id: string }[];
      return { id: rows[0].id };
    } catch (error) {
      if (isExclusionViolation(error)) throw new Error(CLASH_MESSAGE);
      throw error;
    }
  });

export const updateEntry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    baseSchema.and(z.object({ id: z.string().uuid() })).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAuth();
    const { ensureSchema, getSql, isExclusionViolation } = await import("./db.server");
    await ensureSchema();
    const sql = getSql();
    try {
      await sql`
        UPDATE entries SET
          type = ${data.type},
          start_date = ${data.start_date},
          end_date = ${data.end_date},
          guest_name = ${data.guest_name ?? null},
          contact = ${data.contact ?? null},
          payment_status = ${data.payment_status},
          block_reason = ${data.block_reason ?? null},
          notes = ${data.notes ?? null},
          updated_at = now()
        WHERE id = ${data.id}
      `;
      return { id: data.id };
    } catch (error) {
      if (isExclusionViolation(error)) throw new Error(CLASH_MESSAGE);
      throw error;
    }
  });

export const deleteEntry = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { ensureSchema, getSql } = await import("./db.server");
    await ensureSchema();
    const sql = getSql();
    await sql`DELETE FROM entries WHERE id = ${data.id}`;
    return { success: true };
  });
