# Why there is no `loading.tsx` in this route group

A `loading.tsx` wraps every page in its segment — and every nested segment — in an
implicit `<Suspense>` boundary. React then flushes the shell as soon as the layout
resolves, which commits the HTTP status as `200` before the page component has
finished rendering.

That breaks `notFound()`. `/projects/[slug]` calls `notFound()` for an unknown slug;
with a group-level `loading.tsx` in place the visitor still saw the correct
"Project not found" page, but it was served with `200 OK` — a soft 404 that search
engines would happily index.

Verified against Next.js 16.3.4:

| Route | with `(public)/loading.tsx` | without |
| --- | --- | --- |
| `/projects/does-not-exist` | `200` | `404` |
| `/projects/portfolio-cms` | `200` | `200` |

Progressive rendering is instead done with explicit `<Suspense>` boundaries **inside**
`page.tsx`, which stream the hero first and fill in the remaining sections as their
queries resolve. That gives the same perceived-performance benefit without wrapping
the page component itself, so a page is still free to set its own status code.

If a route-level loading state is ever wanted for one page in this group, put that
page inside its own route group (for example `projects/(list)/page.tsx`) so the
`loading.tsx` cannot reach `[slug]`.
