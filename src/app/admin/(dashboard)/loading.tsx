import { Skeleton } from "@/components/ui";

/**
 * Route-level loading state for the dashboard.
 *
 * Safe here — unlike the public group, admin pages that hit a missing record
 * redirect or render their own not-found body rather than relying on the HTTP
 * status, so the Suspense boundary this creates cannot cause a soft 404 on an
 * indexed page. See src/app/(public)/NOTES.md.
 */
export default function Loading() {
  return (
    <div>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
      <span className="sr-only" role="status">
        Loading
      </span>
    </div>
  );
}
