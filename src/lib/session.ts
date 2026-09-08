import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";

import { db } from "@/db";
import { adminUsers, sessions } from "@/db/schema";

export const SESSION_COOKIE = "portfolio_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
/** Re-issue the expiry once a session is more than a day into its life. */
const REFRESH_THRESHOLD_MS = 6 * 24 * 60 * 60 * 1000;

export type SessionUser = { id: number; email: string; name: string };

/**
 * Only the SHA-256 of the token is persisted. SHA-256 is correct here — unlike
 * a password, the token is 256 bits of entropy from a CSPRNG, so there is
 * nothing to brute-force and a slow KDF would only add latency to every
 * request.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: number, userAgent?: string | null): Promise<string> {
  const token = createSessionToken();

  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    userAgent: userAgent?.slice(0, 400) ?? null,
  });

  // Opportunistic cleanup so the table cannot grow without bound.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Resolves the current session against the database.
 *
 * This is the single source of truth for "is this request authenticated". The
 * middleware only checks whether a cookie exists; nothing is trusted until it
 * has been looked up here.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const rows = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      expiresAt: sessions.expiresAt,
      storedHash: sessions.tokenHash,
    })
    .from(sessions)
    .innerJoin(adminUsers, eq(sessions.userId, adminUsers.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Belt and braces: the lookup above already matched on the hash, but compare
  // in constant time so this code cannot become a timing oracle if the query
  // ever changes to a prefix or range match.
  const a = Buffer.from(row.storedHash, "hex");
  const b = Buffer.from(tokenHash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // Rolling expiry: an admin who uses the dashboard daily is never logged out.
  if (row.expiresAt.getTime() - Date.now() < REFRESH_THRESHOLD_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
      .where(eq(sessions.tokenHash, tokenHash));
  }

  return { id: row.id, email: row.email, name: row.name };
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    // Delete server-side first: clearing only the cookie would leave a valid
    // session behind for anyone who had copied the token.
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }

  await clearSessionCookie();
}

/** Invalidate every session for a user — used after a password change. */
export async function destroyAllSessionsFor(userId: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
