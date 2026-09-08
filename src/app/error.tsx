"use client";

import { useEffect } from "react";

/**
 * Root error boundary.
 *
 * The visitor sees a plain apology and a way forward — never a stack trace or
 * an internal message. `error.digest` is the id Next.js writes to the server
 * log, so a real problem can still be traced without leaking anything.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-md text-center">
        <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
          Error
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
          The page could not be loaded. Trying again usually fixes it.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-fg-subtle">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-7 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-lg bg-accent px-5 text-sm font-medium text-accent-fg transition-colors duration-150 hover:bg-accent-hover"
          >
            Try again
          </button>
          {/* A full page load, not a client transition: the router tree is
              already in a broken state, so a soft navigation may fail too. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-border-base px-5 text-sm font-medium text-fg transition-colors duration-150 hover:bg-bg-subtle"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
