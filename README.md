# Neel Khandelwal — Portfolio & CMS

A personal developer portfolio where **every piece of content lives in PostgreSQL** and is
edited through a private admin dashboard. The public site is statically rendered and served
with no database round-trip; saving in the dashboard revalidates only the affected cache tags,
so changes appear within seconds without a rebuild, a redeploy, or a code change.

```
Admin save → Zod validation → PostgreSQL → tag revalidation → public site updated
```

---

## Stack

| Layer | Technology | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, React 19) | Server Components, streaming, tag-based revalidation |
| Language | TypeScript (strict) | Types flow from the DB schema to the UI |
| Styling | Tailwind CSS v4 | Zero-runtime, CSS-first configuration |
| Database | PostgreSQL 18 | Real relational constraints for relational content |
| ORM | Drizzle ORM + drizzle-kit | Thin, typed SQL with proper migrations |
| Driver | `postgres` (postgres.js) | One driver for local, Supabase, Neon, Railway |
| Validation | Zod 4 | One schema shared by forms, Server Actions and the REST API |
| Auth | `node:crypto` scrypt + DB-backed sessions | No dependency, OWASP-approved KDF, server-revocable |
| Storage | Vercel Blob, or the local filesystem in development | Binaries never go into Postgres |
| Analytics | First-party, `sendBeacon` → own endpoint | No third-party script, no cookies |

**No** UI kit, animation library, `next-auth`, state manager, drag-and-drop library or icon
package. Icons are inline SVG; ordering uses accessible move-up/move-down buttons.

---

## Architecture

```
src/
├── app/
│   ├── (public)/        Portfolio — statically rendered, tag-revalidated
│   ├── admin/           CMS — always dynamic, session-guarded
│   ├── api/             Public reads, admin mutations, media serving
│   ├── sitemap.ts robots.ts opengraph-image.tsx
│   └── globals.css      Design tokens for both themes
├── components/
│   ├── ui/              Design-system primitives + inline icons
│   ├── public/          Portfolio sections
│   └── admin/           CMS shell, forms, tables, dialogs, toasts
├── db/                  Drizzle schema + client
├── lib/                 auth, session, password, storage, cache, validation, env
└── services/            The only module that touches the database
```

The layering is strict — UI never imports `@/db`:

```
UI (Server / Client Components)
  ↓
Server Actions & Route Handlers   ← authorisation + Zod validation + revalidation
  ↓
Services (src/services/portfolio.ts)
  ↓
Drizzle → PostgreSQL
```

### Rendering

- The homepage and `/projects` are **statically rendered** from tag-cached queries, so a
  visitor never waits on the database.
- Project pages are pre-rendered per slug via `generateStaticParams`, with `dynamicParams`
  on so a newly published project renders on first request — no rebuild.
- Below-the-fold sections sit behind `<Suspense>`, so a cold render streams the navigation
  and hero first and fills in the rest progressively.
- The admin is `force-dynamic`: the person editing must never see stale content.

> There is deliberately **no `loading.tsx` in the public route group** — it would wrap every
> page in a Suspense boundary that flushes the shell before `notFound()` can set a status,
> turning a missing project into a soft 404. See `src/app/(public)/NOTES.md`.

### Caching

Each content type owns a cache tag (`projects`, `skills`, `experiences`, …). Reads go through
`unstable_cache`; a mutation revalidates only the tags it touched. Nothing purges the whole
site.

### Security

- Session tokens are 256-bit random values; only their SHA-256 hash is stored, so a database
  dump cannot be replayed as a login.
- Cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production, with a rolling 7-day expiry.
- Passwords use scrypt (N=16384, r=8, p=1) with a per-user salt and constant-time comparison.
- Middleware only does a cookie check for redirect UX. **Real authorisation is re-verified
  against the database in the admin layout, in every Server Action, and in every admin route
  handler.**
- Uploads are validated by extension, declared MIME type *and* magic bytes, with size caps.
  SVG is rejected outright. Stored filenames are generated, never taken from the upload.
- A strict CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS and a restrictive `Permissions-Policy`
  are set for every response.

---

## Local development

### Prerequisites

- Node.js 20+
- A PostgreSQL 14+ database

### Setup

```bash
npm install
cp .env.example .env.local     # then fill in DATABASE_URL and AUTH_SECRET
npm run db:migrate             # create the schema
npm run db:seed                # starter content + the admin account
npm run dev
```

The site is at `http://localhost:3000` and the dashboard at `http://localhost:3000/admin`.

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed starter content (safe to re-run — it skips existing rows) |
| `npm run db:studio` | Drizzle Studio |
| `npm run admin:create` | Create or reset the admin password from the environment |
| `npm run check:services` | Smoke-test the data layer against the real database |

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. Use the **pooled** URL on serverless. |
| `AUTH_SECRET` | yes | 32+ random bytes. |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical URLs, sitemap, Open Graph. Falls back to the Vercel URL. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | for `admin:create` / `db:seed` only | Bootstraps the admin account. Remove after first use. |
| `BLOB_READ_WRITE_TOKEN` | production | Enables Vercel Blob. Without it, uploads go to `./.data/uploads`. |

`.env*` is git-ignored apart from `.env.example`. No secret is ever sent to the browser —
`src/lib/env.ts` is marked `server-only`, which turns any accidental client import into a
build error.

---

## Deployment

Designed for Vercel, but it is a standard Next.js app and will run anywhere Node runs.

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Add a Postgres database (Vercel Postgres, Neon or Supabase) and set `DATABASE_URL` to its
   **pooled** connection string.
4. Create a Blob store and set `BLOB_READ_WRITE_TOKEN`.
5. Set `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL`.
6. Run the migrations against production:

   ```bash
   DATABASE_URL="<production url>" npm run db:migrate
   DATABASE_URL="<production url>" npm run db:seed
   ```

7. Sign in at `/admin` and change the seeded password immediately.

> **File storage in production.** Serverless filesystems are ephemeral and read-only, so the
> local upload adapter is for development only. Set `BLOB_READ_WRITE_TOKEN` before uploading
> anything you intend to keep.

---

## Using the dashboard

Everything below changes the public site immediately. No code, JSON, rebuild or redeploy.

| To do this | Go here |
| --- | --- |
| **Add a project** | `/admin/projects` → *New project*. Fill in the name (the slug fills itself), summary, description, technologies and links. Tick **Published** to make it live and **Featured** to put it on the homepage. → *Create project*. |
| **Edit a project** | `/admin/projects` → click its name → change anything → *Save project*. |
| **Delete a project** | Open the project (or use the bin icon in the list) → *Delete* → confirm in the dialog. |
| **Add an internship** | `/admin/experience` → *New experience*. Leave **End date** empty for a current role and the timeline shows "Present". Responsibilities and achievements are one bullet per line. |
| **Edit an internship** | `/admin/experience` → click the role → *Save experience*. |
| **Update skills** | `/admin/skills`. Add a category, then type a skill into that category's box and press *Add*. The pencil renames, the bin deletes, the arrows reorder. |
| **Update education** | `/admin/education` → *New entry*, or click an existing one. |
| **Add certifications** | `/admin/certifications` → *New certification*. Add the credential ID and verification URL to get a *Verify* link on the public site. |
| **Add achievements** | `/admin/achievements` → *New achievement*. |
| **Update the resume** | `/admin/resume` → *Upload* a PDF → *Save resume*. The hero button and resume section appear automatically. |
| **Change your profile** | `/admin/profile` — name, headline, hero introduction, about text, photo, email, location, availability badge. |
| **Change social links** | `/admin/social-links`. The platform you pick decides the icon. |
| **SEO and the footer** | `/admin/settings` — page title, meta description, keywords, social preview image, footer text, and switches for the contact form and analytics. |
| **Read contact messages** | `/admin/messages`. |
| **Manage uploaded files** | `/admin/media`. |

Ordering everywhere uses the **↑ / ↓ buttons**, which write `display_order` — the same column
the public site sorts by. Buttons were chosen over drag-and-drop deliberately: they are
keyboard-operable, work on touch without a gesture library, are announced correctly by screen
readers, and add no dependency.

---

## API

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/api/projects` | Public. Published projects only. |
| `POST` | `/api/contact` | Public. Validated, honeypot-protected, rate-limited. |
| `POST` | `/api/analytics` | Public. Allowlisted event names only. |
| `GET` | `/api/media/*` | Public. Local storage adapter only. |
| `GET POST` | `/api/admin/projects` | **Admin session required.** |
| `GET PUT DELETE` | `/api/admin/projects/:id` | **Admin session required.** |
| `POST` | `/api/admin/upload` | **Admin session required.** |

Every admin route verifies the session against the database and checks the request origin.
Unauthenticated requests get `401` and change nothing.

---

## Database

15 tables with primary keys, foreign keys, indexes, timestamps and constraints. Migrations
live in `drizzle/`.

`admin_users`, `sessions`, `profile`, `skill_categories`, `skills`, `projects`, `experiences`,
`education`, `certifications`, `achievements`, `social_links`, `media`, `site_settings`,
`contact_messages`, `analytics_events`.

Two deliberate simplifications from a fully normalised design:

- **Technologies, responsibilities and achievements are `text[]` columns** rather than join
  tables. They are labels with no attributes of their own, so a join table would add queries
  and CRUD complexity for nothing. Postgres arrays are first-class and indexable.
- **Project screenshots are `jsonb`** (`{url, caption}`), for the same reason.

The `media` table remains a real registry of uploaded files so the media library can list and
clean them up.
