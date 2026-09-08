import { revalidatePath, revalidateTag, unstable_cache, updateTag } from "next/cache";

/**
 * Cache tags.
 *
 * Each content type owns one tag. A mutation revalidates only the tags it
 * actually touched, so editing a certification never throws away the cached
 * project queries.
 */
export const TAGS = {
  profile: "profile",
  skills: "skills",
  projects: "projects",
  experiences: "experiences",
  education: "education",
  certifications: "certifications",
  achievements: "achievements",
  socialLinks: "social-links",
  settings: "settings",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

/**
 * Wraps a data-layer read in the Next.js data cache.
 *
 * `revalidate` is a long fallback rather than the primary freshness mechanism —
 * correctness comes from tag revalidation on write. The timer only protects
 * against a mutation path that somehow failed to revalidate.
 */
export function cachedQuery<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  tags: CacheTag[],
): (...args: Args) => Promise<Result> {
  return unstable_cache(fn, keyParts, { tags, revalidate: 3600 });
}

/**
 * Where the invalidation is being triggered from.
 *
 * Next.js exposes two functions with different guarantees, and calling the
 * wrong one throws:
 *
 * - `updateTag` expires the entry immediately and gives read-your-own-writes,
 *   but only works inside a Server Action.
 * - `revalidateTag` works anywhere; `{ expire: 0 }` asks for the same immediate
 *   expiry from a Route Handler.
 */
export type RevalidateContext = "action" | "route";

function expire(tag: string, context: RevalidateContext): void {
  if (context === "action") updateTag(tag);
  else revalidateTag(tag, { expire: 0 });
}

/**
 * Invalidate the cache after a mutation.
 *
 * Tag revalidation refreshes the data cache; the public path is revalidated so
 * statically rendered pages regenerate. Both are scoped — no site-wide purge.
 */
export function revalidateContent(tags: CacheTag[], context: RevalidateContext = "action"): void {
  for (const tag of tags) expire(tag, context);
  // The public portfolio is one page composed of every section, so any content
  // change can affect it. Project detail pages are handled per-slug below.
  revalidatePath("/", "page");
}

export function revalidateProject(
  slugs: (string | null | undefined)[] = [],
  context: RevalidateContext = "action",
): void {
  expire(TAGS.projects, context);
  revalidatePath("/", "page");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/projects/${slug}`, "page");
  }
}
