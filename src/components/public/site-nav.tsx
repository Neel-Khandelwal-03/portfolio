"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type NavItem = { id: string; label: string };

/**
 * Sticky site navigation.
 *
 * Scroll-spy uses one IntersectionObserver rather than a scroll listener, so
 * highlighting the current section costs nothing on the main thread while the
 * user scrolls.
 */
export function SiteNav({ items, name }: { items: NavItem[]; name: string }) {
  const pathname = usePathname();
  const onHome = pathname === "/";

  const [active, setActive] = useState<string>(items[0]?.id ?? "");
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

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        }

        // Pick the section nearest the top of the viewport among those visible,
        // which matches what the reader perceives as "the current section".
        let best: string | null = null;
        let bestTop = Infinity;
        for (const id of visible.keys()) {
          const top = document.getElementById(id)?.getBoundingClientRect().top ?? Infinity;
          if (top < bestTop) {
            bestTop = top;
            best = id;
          }
        }
        if (best) setActive(best);
      },
      { rootMargin: "-88px 0px -55% 0px", threshold: [0, 0.15] },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [items, onHome]);

  /* Shadow once the page has scrolled ------------------------------------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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
    <header
      className={cn(
        "no-print sticky top-0 z-50 border-b transition-colors duration-200",
        scrolled
          ? "border-border-base bg-bg/85 backdrop-blur-md"
          : "bg-bg/60 border-transparent backdrop-blur-sm",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-5 sm:px-6"
      >
        <Link
          href="/"
          className="text-fg mr-auto rounded-md text-[15px] font-semibold tracking-tight"
        >
          {name}
          <span className="text-accent">.</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-0.5 lg:flex">
          {items.map((item) => {
            const current = onHome && active === item.id;
            return (
              <li key={item.id}>
                <Link
                  href={href(item.id)}
                  aria-current={current ? "true" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
                    current ? "text-accent" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <ThemeToggle className="hidden sm:inline-flex" />

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="border-border-base text-fg-muted hover:text-fg grid h-9 w-9 place-items-center rounded-lg border lg:hidden"
        >
          <MenuIcon width={18} height={18} />
        </button>
      </nav>

      {/* Mobile menu */}
      {open ? (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/40"
          />
          <div className="border-border-base bg-bg shadow-raised absolute inset-x-0 top-0 max-h-dvh overflow-y-auto border-b pb-6">
            <div className="flex h-16 items-center gap-4 px-5">
              <span className="mr-auto text-[15px] font-semibold">{name}</span>
              <ThemeToggle />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="border-border-base text-fg-muted hover:text-fg grid h-9 w-9 place-items-center rounded-lg border"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <ul className="px-3">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={href(item.id)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-[15px] font-medium",
                      onHome && active === item.id
                        ? "bg-accent-soft text-accent"
                        : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </header>
  );
}
