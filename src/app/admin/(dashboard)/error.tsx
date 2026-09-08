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
    <div className="border-border-base bg-bg-raised rounded-xl border p-8 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-fg-muted mx-auto mt-2 max-w-md text-sm">
        This screen could not be loaded. Your data has not been changed.
      </p>
      {error.digest ? (
        <p className="text-fg-subtle mt-2 font-mono text-xs">Reference: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="bg-accent text-accent-fg hover:bg-accent-hover mt-6 inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
