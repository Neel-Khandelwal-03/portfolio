import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="border-border-base bg-bg-raised rounded-xl border p-8 text-center">
      <h1 className="text-lg font-semibold">Not found</h1>
      <p className="text-fg-muted mx-auto mt-2 max-w-md text-sm">
        That record does not exist. It may have been deleted from another tab.
      </p>
      <Link
        href="/admin"
        className="bg-accent text-accent-fg hover:bg-accent-hover mt-6 inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
