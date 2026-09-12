"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ComponentProps, type MouseEvent } from "react";

/**
 * A link that morphs the card you clicked into the page it opens.
 *
 * Next 16.3.4 has no built-in view-transition integration and React exports no
 * `ViewTransition` component, so this drives the browser API directly. The
 * awkward part is timing: `router.push` returns immediately, long before the
 * new route commits, so the transition callback returns a promise that is only
 * resolved once `usePathname` reports the new URL — with a timeout so a slow or
 * failed navigation can never leave the page frozen on a stale snapshot.
 *
 * Everything here is an enhancement. Without `startViewTransition`, with
 * reduced motion, on a modified click, or with JavaScript disabled, this is an
 * ordinary `next/link`.
 */

type ViewTransition = { finished: Promise<unknown> };
type DocumentWithTransitions = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransition;
};

/**
 * How long to hold the frozen snapshot before giving up on the navigation.
 *
 * The page is inert while the transition waits, so this is a budget for how
 * long a click may look like it did nothing. Next prefetches these routes, so
 * the commit is normally an order of magnitude inside it.
 */
const NAVIGATION_TIMEOUT_MS = 600;

/**
 * Elements inside the clicked card that pair with a counterpart on the target
 * page. Names have to be unique across the document, so they are applied to one
 * card at click time and removed as soon as the transition ends.
 */
const MORPH_PAIRS = [
  ["[data-vt-media]", "project-media"],
  ["[data-vt-title]", "project-title"],
] as const;

export function TransitionLink({ href, onClick, children, ...rest }: ComponentProps<typeof Link>) {
  const router = useRouter();
  const pathname = usePathname();

  const release = useRef<(() => void) | null>(null);
  const named = useRef<HTMLElement[]>([]);

  // The new route has committed — let the browser take its "after" snapshot.
  useEffect(() => {
    const resolve = release.current;
    if (!resolve) return;
    release.current = null;
    resolve();
  }, [pathname]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const doc = document as DocumentWithTransitions;
    const url = typeof href === "string" ? href : null;

    if (
      !url ||
      typeof doc.startViewTransition !== "function" ||
      // A hidden document aborts the transition, and React deprioritises the
      // render behind it — which is exactly when freezing the page is worst.
      document.visibilityState !== "visible" ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      rest.target === "_blank" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    event.preventDefault();

    const card = event.currentTarget.closest("[data-project]");
    if (card) {
      for (const [selector, name] of MORPH_PAIRS) {
        const element = card.querySelector<HTMLElement>(selector);
        if (!element) continue;
        element.style.setProperty("view-transition-name", name);
        named.current.push(element);
      }
    }

    const clearNames = () => {
      for (const element of named.current) element.style.removeProperty("view-transition-name");
      named.current = [];
    };

    const transition = doc.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          let timer = 0;
          const done = () => {
            window.clearTimeout(timer);
            resolve();
          };

          timer = window.setTimeout(() => {
            release.current = null;
            done();
          }, NAVIGATION_TIMEOUT_MS);

          release.current = done;
          // Deliberately not inside `startTransition`: the whole page is
          // frozen until this commits, so it wants the higher priority.
          router.push(url);
        }),
    );

    transition.finished.then(clearNames, clearNames);
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
