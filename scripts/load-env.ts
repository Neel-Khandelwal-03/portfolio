import fs from "node:fs";
import path from "node:path";

/**
 * Minimal .env loader for the standalone CLI scripts.
 *
 * Next.js loads `.env.local` on its own, but `tsx`/`drizzle-kit` do not, and
 * pulling in `dotenv` for ~30 lines of parsing is not worth a dependency.
 * Precedence matches Next.js: `.env.local` wins over `.env`.
 */
export function loadEnv(cwd = process.cwd()): void {
  for (const file of [".env", ".env.local"]) {
    const full = path.join(cwd, file);
    if (!fs.existsSync(full)) continue;

    for (const rawLine of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const eq = line.indexOf("=");
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // A variable already present in the real environment wins, so a
      // one-off `DATABASE_URL=... npm run db:migrate` targets what you asked
      // for rather than silently being overwritten by the file.
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadEnv();
