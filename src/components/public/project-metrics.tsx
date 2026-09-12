import { cn } from "@/lib/utils";
import type { ProjectMetric } from "@/db/schema";

/**
 * Measured outcomes.
 *
 * A project page is mostly claims; these are the only part a reader can check
 * at a glance, so they get typographic weight out of proportion to their word
 * count. Both variants render nothing when a project has no metrics, which is
 * the normal case — an empty band would be worse than no band.
 */

/** The wide band under the cover on a case-study page. */
export function MetricBand({
  metrics,
  className,
}: {
  metrics: ProjectMetric[];
  className?: string;
}) {
  if (metrics.length === 0) return null;

  return (
    <dl
      className={cn(
        "border-border-base bg-bg-raised/60 divide-border-hair rounded-panel grid divide-y border backdrop-blur-sm",
        metrics.length === 2 && "sm:grid-cols-2 sm:divide-x sm:divide-y-0",
        metrics.length >= 3 && "sm:grid-cols-3 sm:divide-x sm:divide-y-0",
        className,
      )}
    >
      {metrics.map((metric, index) => (
        // Reversed so the figure reads first while the markup keeps dt before dd.
        <div key={index} className="flex flex-col-reverse gap-2.5 p-6 sm:p-8">
          <dt className="label text-fg-subtle">{metric.label}</dt>
          <dd className="font-mono text-[clamp(1.75rem,4.5vw,2.75rem)] leading-none font-medium tracking-tight">
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The compact inline version used inside a homepage feature block. */
export function MetricRow({
  metrics,
  className,
}: {
  metrics: ProjectMetric[];
  className?: string;
}) {
  if (metrics.length === 0) return null;

  return (
    <dl className={cn("flex flex-wrap gap-x-10 gap-y-4", className)}>
      {metrics.map((metric, index) => (
        <div key={index} className="flex flex-col-reverse gap-1">
          <dt className="label text-fg-subtle">{metric.label}</dt>
          <dd className="font-mono text-[22px] leading-none font-medium tracking-tight">
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
