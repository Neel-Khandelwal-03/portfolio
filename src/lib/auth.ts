import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, getSessionUser, setSessionCookie, type SessionUser } from "@/lib/session";

/* -------------------------------------------------------------------------- */
/* Login throttling                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Per-instance failed-login counter.
 *
 * scrypt already makes each guess cost ~100ms of CPU, which is the real defence.
 * This adds a hard stop on top of it without a Redis dependency. It is
 * per-instance, so it is a speed bump rather than a guarantee on a horizontally
 * scaled deployment — stated plainly rather than pretended otherwise.
 */
const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function throttleKey(email: string, ip: string) {
  return `${email}|${ip}`;
}

export function isThrottled(email: string, ip: string): boolean {
  const entry = attempts.get(throttleKey(email, ip));
  if (!entry) return false;

  if (Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.delete(throttleKey(email, ip));
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(email: string, ip: string): void {
  const key = throttleKey(email, ip);
  const entry = attempts.get(key);

  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

function clearFailures(email: string, ip: string): void {
  attempts.delete(throttleKey(email, ip));
}

/* -------------------------------------------------------------------------- */
/* Login                                                                       */
/* -------------------------------------------------------------------------- */

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";

  if (isThrottled(email, ip)) {
    return { ok: false, error: "Too many failed attempts. Try again in 15 minutes." };
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase()))
    .limit(1);

  // Always run a verification, even when the account does not exist, so the
  // response time does not reveal which emails are registered.
  const stored =
    user?.passwordHash ??
    "scrypt$16384$8$1$00000000000000000000000000000000$" + "0".repeat(128);

  const valid = await verifyPassword(password, stored);

  if (!user || !valid) {
    recordFailure(email, ip);
    return { ok: false, error: "Incorrect email or password." };
  }

  clearFailures(email, ip);

  const token = await createSession(user.id, headerList.get("user-agent"));
  await setSessionCookie(token);

  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, user.id));

  return { ok: true };
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<LoginResult> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  if (!user) return { ok: false, error: "Account not found." };

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { ok: false, error: "Your current password is incorrect." };
  }

  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(adminUsers.id, userId));

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Authorisation guards                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Guard for admin pages and Server Actions.
 *
 * Every admin page layout and every mutating action calls this. The middleware
 * redirect is only a UX nicety — this database check is the actual gate.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Guard for Route Handlers. Returns a 401 response instead of redirecting. */
export async function requireAdminApi(): Promise<
  { ok: true; user: SessionUser } | { ok: false; response: NextResponse }
> {
  const user = await getSessionUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "cache-control": "no-store" } },
      ),
    };
  }

  return { ok: true, user };
}

/**
 * Rejects cross-site state-changing requests.
 *
 * `SameSite=Lax` already stops the browser sending the session cookie on a
 * cross-site POST, so this is defence in depth for the REST endpoints. Server
 * Actions get the same protection from Next.js's own origin check.
 */
export async function assertSameOrigin(request: Request): Promise<boolean> {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Same-origin fetches and curl send no Origin header.

  const headerList = await headers();
  const host = headerList.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
