"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="rounded-xl border border-border-base bg-bg-raised p-8 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
        This screen could not be loaded. Your data has not been changed.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-fg-subtle">Reference: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
      >
        Try again
      </button>
    </div>
  );
}
