import { useSession } from "@tanstack/react-start/server";

/**
 * Lightweight shared-password session for POLAM STAY.
 * Stores only an `authed` flag in an encrypted, http-only cookie.
 */

export interface PolamSession {
  authed: boolean;
}

function sessionPassword(): string {
  // SESSION_SECRET is optional; a stable fallback keeps preview working.
  return (
    process.env.SESSION_SECRET ??
    "polam-stay-default-session-secret-please-set-SESSION_SECRET-32chars"
  );
}

export function getAppSession() {
  return useSession<PolamSession>({
    password: sessionPassword(),
    name: "polam_session",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
