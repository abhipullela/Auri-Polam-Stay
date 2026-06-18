import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Centralized SQL access for POLAM STAY.
 * Uses the Neon serverless HTTP driver, which runs on the edge runtime.
 * The connection string is read from the DATABASE_URL secret at call time.
 */

let cachedSql: NeonQueryFunction<false, false> | null = null;
let schemaReady = false;

export function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured yet. Add your Neon connection string to connect the database.",
    );
  }
  if (!cachedSql) {
    cachedSql = neon(url);
  }
  return cachedSql;
}

const DEFAULT_PASSWORD = "polam-stay";

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Idempotently creates the schema. The `entries` table uses a GiST exclusion
 * constraint so that NO two date ranges can ever overlap — this guarantees, at
 * the database level, that bookings and blocked periods can never clash, even
 * if two users submit at the exact same moment.
 */
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = getSql();

  await sql`CREATE EXTENSION IF NOT EXISTS btree_gist`;

  await sql`
    CREATE TABLE IF NOT EXISTS entries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL CHECK (type IN ('booking', 'block')),
      start_date date NOT NULL,
      end_date date NOT NULL CHECK (end_date > start_date),
      guest_name text,
      contact text,
      payment_status text NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
      block_reason text,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      EXCLUDE USING gist (daterange(start_date, end_date, '[)') WITH &&)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const defaultHash = await sha256(DEFAULT_PASSWORD);
  await sql`
    INSERT INTO app_settings (key, value)
    VALUES ('team_password_hash', ${defaultHash}), ('resort_name', 'POLAM STAY')
    ON CONFLICT (key) DO NOTHING
  `;

  schemaReady = true;
}

export async function getSetting(key: string): Promise<string | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`SELECT value FROM app_settings WHERE key = ${key}`) as { value: string }[];
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (${key}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
}

export async function verifyTeamPassword(password: string): Promise<boolean> {
  const stored = await getSetting("team_password_hash");
  if (!stored) return false;
  return (await sha256(password)) === stored;
}

export async function updateTeamPassword(current: string, next: string): Promise<void> {
  if (!(await verifyTeamPassword(current))) {
    throw new Error("Current password is incorrect.");
  }
  if (next.length < 4) {
    throw new Error("New password must be at least 4 characters.");
  }
  await setSetting("team_password_hash", await sha256(next));
}

export function isExclusionViolation(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  if (code === "23P01") return true;
  const message = error instanceof Error ? error.message : String(error);
  return /exclu|overlap|conflicting key|daterange/i.test(message);
}
