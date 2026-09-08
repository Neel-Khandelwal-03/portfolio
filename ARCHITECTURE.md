# Architecture Note

_Phase 0 deliverable. Written after auditing the repository (empty directory, no prior code,
no deployment config, no git history) and the local toolchain._

## Environment audit findings

| Check             | Result                                                                   |
| ----------------- | ------------------------------------------------------------------------ |
| Existing source   | None — directory was empty                                               |
| Git               | Not initialised (initialised by `create-next-app`)                       |
| Deployment config | None                                                                     |
| Node / npm        | v24.12.0 / 11.6.2                                                        |
| PostgreSQL        | 18.4 installed locally (scoop), cluster present, started for development |
| Docker            | Installed, daemon not running — not required by this design              |
| Vercel CLI        | 59.10.0 installed, **not authenticated**                                 |
| GitHub CLI        | Not installed                                                            |

Nothing was reusable, so the project is a clean build.

## Chosen stack

| Layer        | Choice                                                         | Why                                                                                  |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Framework    | Next.js 16 (App Router, React 19 Server Components)            | Server-first rendering, streaming, tag-based revalidation, first-class Vercel deploy |
| Language     | TypeScript (strict)                                            | Type safety across the DB → service → UI boundary                                    |
| Styling      | Tailwind CSS v4                                                | Zero-runtime, CSS-first config, no CSS-in-JS bundle cost                             |
| ORM          | Drizzle ORM + drizzle-kit                                      | Thin, typed SQL. No heavy runtime, no query-engine binary                            |
| Database     | PostgreSQL 18                                                  | Relational content model with real constraints                                       |
| DB driver    | `postgres` (postgres.js)                                       | Single driver that works against local PG, Supabase, Neon, Railway                   |
| Validation   | Zod 4                                                          | One schema shared by server actions, API routes and forms                            |
| Auth         | Custom: `node:crypto` scrypt + DB-backed opaque sessions       | No dependency, OWASP-approved KDF, server-revocable sessions                         |
| File storage | Pluggable adapter: Vercel Blob (prod) / local filesystem (dev) | Binaries never touch Postgres; dev works with no cloud account                       |
| Deployment   | Vercel                                                         | Native fit for Next.js; CLI already present                                          |

### Dependencies and their justification

Every runtime dependency earns its place:

- `next`, `react`, `react-dom` — the framework.
- `drizzle-orm` + `postgres` — database access.
- `zod` — input validation on every mutation.
- `@vercel/blob` — production object storage.

Dev-only: `drizzle-kit` (migrations), `tsx` (running TS seed/admin scripts), `typescript`,
`eslint`, `prettier`, `tailwindcss`.

Deliberately **not** installed: no UI kit, no animation library, no `next-auth`, no state
manager, no drag-and-drop library, no icon package (icons are inline SVG). Each of those would
add bundle weight for something the app can do natively.

## Folder structure

```
src/
├── app/
│   ├── (public)/          # Public portfolio — static-rendered, tag-revalidated
│   ├── admin/             # Private CMS — always dynamic, session-guarded
│   ├── api/               # Public reads + admin mutations + media serving
│   ├── sitemap.ts robots.ts
│   └── globals.css
├── components/
│   ├── ui/                # Design-system primitives
│   ├── public/            # Portfolio sections
│   └── admin/             # CMS tables, forms, dialogs
├── db/                    # Drizzle schema, client, seed
├── lib/                   # auth, session, storage, cache, env, utils
├── services/              # Data-access layer (the only place that touches `db`)
└── types/
```

Strict layering — UI never imports `db` directly:

```
UI (RSC / client components)
  ↓
Server Actions & Route Handlers  (authz + Zod validation + revalidation)
  ↓
Services  (src/services/*)
  ↓
Drizzle → PostgreSQL
```

## Rendering strategy

- **Public pages are statically rendered** from tag-cached queries. A visitor gets HTML with no
  database round-trip on the request path — the fastest possible result.
- **Below-the-fold sections sit behind `<Suspense>`** so that a cold render streams the
  navigation and hero immediately and fills in About → Skills → Experience → Projects →
  Education → Certifications → Achievements → Contact progressively.
- **Project detail pages** are statically generated per slug via `generateStaticParams`, with
  `dynamicParams` on so newly-created projects render on first request and are then cached.
- **The admin dashboard is fully dynamic** (`force-dynamic`) — it must never serve stale content
  to the person editing it.
- Client JavaScript is limited to genuinely interactive islands: theme toggle, mobile nav,
  scroll-spy, contact form, and the admin forms. Every portfolio section is a Server Component.

## Caching strategy

Each entity has a cache tag (`projects`, `skills`, `experiences`, …) plus a `portfolio`
super-tag. Reads go through `unstable_cache` keyed and tagged per entity; mutations call
`revalidateTag` for only the tags they touched.

```
Admin save → Zod validate → service write → revalidateTag('projects')
           → affected routes regenerate → public site updated
```

No full-site invalidation, no redeploy, no rebuild for ordinary content changes.

## Security model

- Sessions are opaque 256-bit random tokens; only a SHA-256 hash is stored in the database, so a
  database leak cannot be replayed as a login.
- Cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production, with a rolling 7-day expiry.
- Passwords use `scrypt` (N=16384, r=8, p=1) with a per-user random salt and constant-time
  comparison.
- Middleware performs a cheap cookie check for redirect UX only. **Real authorisation is
  re-verified against the database inside every admin layout, server action and API route** —
  the middleware is never the gate.
- Uploads are validated by extension, declared MIME type and magic-byte sniffing, with a size
  cap, and are stored under generated names so a user-supplied filename can never traverse paths
  or land as executable content.
