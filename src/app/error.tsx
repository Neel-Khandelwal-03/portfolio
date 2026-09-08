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
        <p className="text-accent font-mono text-[11px] font-semibold tracking-[0.16em] uppercase">
          Error
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-fg-muted mt-3 text-[15px] leading-relaxed">
          The page could not be loaded. Trying again usually fixes it.
        </p>
        {error.digest ? (
          <p className="text-fg-subtle mt-3 font-mono text-xs">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-7 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="bg-accent text-accent-fg hover:bg-accent-hover inline-flex h-10 items-center rounded-lg px-5 text-sm font-medium transition-colors duration-150"
          >
            Try again
          </button>
          {/* A full page load, not a client transition: the router tree is
              already in a broken state, so a soft navigation may fail too. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="border-border-base text-fg hover:bg-bg-subtle inline-flex h-10 items-center rounded-lg border px-5 text-sm font-medium transition-colors duration-150"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
