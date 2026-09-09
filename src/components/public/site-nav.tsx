"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRightIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type NavItem = { id: string; label: string };

/**
 * Returns the reader to the top of the homepage.
 *
 * Navigating to "/" while already on "/" is a no-op in the router, so the
 * wordmark appeared dead once the page had been scrolled. This handles that
 * case directly and also clears any `#section` left in the address bar by the
 * nav, so the URL matches where the reader actually is.
 *
 * Modified and non-primary clicks fall through untouched, so open-in-new-tab
 * still works. `scrollTo` is called without an explicit behaviour so the CSS
 * `scroll-behavior` applies — which is already switched to `auto` under
 * `prefers-reduced-motion`.
 */
function scrollToTop(event: React.MouseEvent<HTMLAnchorElement>) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    return;
  }

  event.preventDefault();
  window.scrollTo({ top: 0, left: 0 });

  if (window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

/**
 * Floating site navigation.
 *
 * A detached pill rather than a full-width bar: it reads as a deliberate
 * component, takes less vertical space, and lets the hero run to the top of the
 * viewport behind it.
 *
 * Scroll-spy uses one IntersectionObserver rather than a scroll listener, so
 * highlighting the current section costs nothing on the main thread.
 */
export function SiteNav({
  items,
  name,
  resumeUrl,
}: {
  items: NavItem[];
  name: string;
  resumeUrl?: string | null;
}) {
  const pathname = usePathname();
  const onHome = pathname === "/";

  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /* Scroll-spy ------------------------------------------------------------ */
  useEffect(() => {
    if (!onHome) return;

    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }

        // The section nearest the top of the viewport among those visible is
        // what the reader perceives as "current".
        let best: string | null = null;
        let bestTop = Infinity;
        for (const id of visible) {
          const top = document.getElementById(id)?.getBoundingClientRect().top ?? Infinity;
          if (top < bestTop) {
            bestTop = top;
            best = id;
          }
        }
        if (best) setActive(best);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [items, onHome]);

  /* Condense once the page has scrolled ----------------------------------- */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      // Back at the hero, no section is current. Without this the observer
      // leaves the last section highlighted, because none of them are inside
      // its band up here for it to react to.
      if (window.scrollY < 80) setActive("");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Mobile menu: lock scroll and trap Escape while open -------------------- */
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const href = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  return (
    <header className="no-print pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-3 sm:px-6 sm:pt-4">
        {/* Wordmark — also the way back to the top of the page */}
        <Link
          href="/"
          onClick={onHome ? scrollToTop : undefined}
          aria-label={onHome ? "Back to top" : undefined}
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-semibold tracking-tight transition-all duration-300",
            scrolled
              ? "border-border-base bg-bg/80 shadow-card backdrop-blur-xl"
              : "border-transparent bg-transparent",
          )}
        >
          {name}
          <span className="bg-accent inline-block h-1.5 w-1.5 rounded-full" aria-hidden />
        </Link>

        {/* Desktop links */}
        <nav
          aria-label="Main"
          className={cn(
            "border-border-base bg-bg/80 shadow-card pointer-events-auto mx-auto hidden rounded-full border p-1 backdrop-blur-xl transition-opacity duration-300 lg:flex",
          )}
        >
          <ul className="flex items-center">
            {items.map((item) => {
              const current = onHome && active === item.id;
              return (
                <li key={item.id}>
                  <Link
                    href={href(item.id)}
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "relative block rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200",
                      current ? "text-accent" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {current ? (
                      <span className="bg-accent-soft absolute inset-0 rounded-full" aria-hidden />
                    ) : null}
                    <span className="relative">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="pointer-events-auto ml-auto flex items-center gap-2 lg:ml-0">
          {resumeUrl ? (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border-base bg-bg/80 shadow-card text-fg hover:border-border-strong hidden h-9 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium backdrop-blur-xl transition-colors duration-200 sm:inline-flex"
            >
              Resume
              <ArrowRightIcon width={13} height={13} className="-rotate-45" />
            </a>
          ) : null}

          <div className="border-border-base bg-bg/80 shadow-card hidden rounded-full border p-0.5 backdrop-blur-xl sm:block">
            <ThemeToggle className="border-0 bg-transparent p-0" />
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="border-border-base bg-bg/80 shadow-card text-fg-muted hover:text-fg grid h-10 w-10 place-items-center rounded-full border backdrop-blur-xl transition-colors duration-200 lg:hidden"
          >
            <MenuIcon width={18} height={18} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="pointer-events-auto fixed inset-0 z-50 lg:hidden"
        >
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm"
          />
          <div className="border-border-base bg-bg rounded-panel shadow-float absolute inset-x-3 top-3 max-h-[calc(100dvh-1.5rem)] overflow-y-auto border p-3">
            <div className="flex items-center gap-3 px-2 pb-3">
              <span className="mr-auto text-[15px] font-semibold tracking-tight">{name}</span>
              <ThemeToggle />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="border-border-base text-fg-muted hover:text-fg grid h-9 w-9 place-items-center rounded-full border"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <ul className="border-border-hair border-t pt-2">
              {items.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={href(item.id)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors duration-200",
                      onHome && active === item.id
                        ? "bg-accent-soft text-accent"
                        : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                    )}
                  >
                    <span className="label text-fg-subtle tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="bg-accent text-accent-fg mt-2 flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-medium"
              >
                View resume
                <ArrowRightIcon width={15} height={15} className="-rotate-45" />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
