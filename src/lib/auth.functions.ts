import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAuthStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getAppSession } = await import("./auth.server");
  const session = await getAppSession();
  return { authed: session.data.authed === true };
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) =>
    z.object({ password: z.string().min(1, "Enter the team password") }).parse(data),
  )
  .handler(async ({ data }) => {
    const { verifyTeamPassword } = await import("./db.server");
    const { getAppSession } = await import("./auth.server");

    const ok = await verifyTeamPassword(data.password);
    if (!ok) {
      throw new Error("Incorrect team password.");
    }
    const session = await getAppSession();
    await session.update({ authed: true });
    return { authed: true };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { getAppSession } = await import("./auth.server");
  const session = await getAppSession();
  await session.clear();
  return { authed: false };
});

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator((data: { current: string; next: string }) =>
    z
      .object({
        current: z.string().min(1, "Enter the current password"),
        next: z.string().min(4, "New password must be at least 4 characters"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { getAppSession } = await import("./auth.server");
    const session = await getAppSession();
    if (session.data.authed !== true) {
      throw new Error("You must be signed in to change the password.");
    }
    const { updateTeamPassword } = await import("./db.server");
    await updateTeamPassword(data.current, data.next);
    return { success: true };
  });

export const getResortName = createServerFn({ method: "GET" }).handler(async () => {
  const { getSetting } = await import("./db.server");
  const name = await getSetting("resort_name");
  return { name: name ?? "POLAM STAY" };
});
