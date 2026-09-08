import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * A single pooled connection per process.
 *
 * Next.js hot-reloads modules in development, which would otherwise open a new
 * pool on every edit until Postgres refuses connections, so the client is
 * cached on `globalThis`.
 */
const globalForDb = globalThis as unknown as {
  __portfolioSql?: ReturnType<typeof postgres>;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }

  return postgres(url, {
    // Serverless functions are short-lived; a small pool avoids exhausting the
    // database's connection limit across concurrent invocations.
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idle_timeout: 20,
    connect_timeout: 15,
    // Managed Postgres (Supabase, Neon, Railway) terminates plaintext connections.
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
    prepare: false,
  });
}

export const sql = globalForDb.__portfolioSql ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__portfolioSql = sql;
}

export const db = drizzle(sql, { schema });

export { schema };
