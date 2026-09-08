import "./load-env";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { hashPassword } from "../src/lib/password";
import * as s from "../src/db/schema";

/**
 * Creates or updates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 * Run this once against production after deploying, then remove the password
 * from the environment. Passwords are never stored or logged in plain text.
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

const email = process.env.ADMIN_EMAIL?.toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must both be set.");
}

if (password.length < 12) {
  throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
}

const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
const client = postgres(url, { max: 1, ssl: isLocal ? false : "require" });
const db = drizzle(client, { schema: s });

async function main() {
  const passwordHash = await hashPassword(password!);
  const [existing] = await db
    .select()
    .from(s.adminUsers)
    .where(eq(s.adminUsers.email, email!))
    .limit(1);

  if (existing) {
    await db
      .update(s.adminUsers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(s.adminUsers.id, existing.id));
    // Existing sessions are invalidated so a changed password takes effect now.
    await db.delete(s.sessions).where(eq(s.sessions.userId, existing.id));
    console.log(`Password updated for ${email}. All existing sessions were signed out.`);
  } else {
    await db.insert(s.adminUsers).values({ email: email!, name: "Neel Khandelwal", passwordHash });
    console.log(`Admin user created: ${email}`);
  }
}

main()
  .catch((error) => {
    console.error("Failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
