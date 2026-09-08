import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="rounded-xl border border-border-base bg-bg-raised p-8 text-center">
      <h1 className="text-lg font-semibold">Not found</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
        That record does not exist. It may have been deleted from another tab.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
