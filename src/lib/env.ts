import "server-only";

/**
 * Server-side environment access.
 *
 * Nothing in this module may be imported from a client component — the
 * `server-only` guard turns that into a build error rather than a leaked secret.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        "Copy .env.example to .env.local and fill it in.",
    );
  }
  return value;
}

export const serverEnv = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get authSecret() {
    return required("AUTH_SECRET");
  },
  get blobToken() {
    return process.env.BLOB_READ_WRITE_TOKEN ?? null;
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};

/** Safe to reference anywhere — it is a NEXT_PUBLIC_ value. */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
