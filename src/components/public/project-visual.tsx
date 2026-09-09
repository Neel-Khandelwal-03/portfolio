import Image from "next/image";

import { cn } from "@/lib/utils";
import type { Project } from "@/db/schema";

/**
 * The visual that stands in for a project.
 *
 * Most projects here have no screenshot, and a grey placeholder box would make
 * the most important section of the site the emptiest. So when there is no
 * cover image this draws a composed panel from data the project already has —
 * its initials, category and stack — on a technical grid field.
 *
 * The variant is derived from the slug, so a project always gets the same
 * treatment and no two neighbours look identical.
 */

const VARIANTS = [
  { rotate: "-6deg", from: "12%", to: "78%" },
  { rotate: "8deg", from: "70%", to: "18%" },
  { rotate: "-3deg", from: "24%", to: "88%" },
  { rotate: "5deg", from: "82%", to: "34%" },
] as const;

function hash(value: string): number {
  let total = 0;
  for (let i = 0; i < value.length; i += 1) total = (total * 31 + value.charCodeAt(i)) >>> 0;
  return total;
}

/** First letter of each of the first two significant words. */
function projectMark(title: string): string {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "··";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function ProjectVisual({
  project,
  priority = false,
  className,
  sizes = "(max-width: 1024px) 100vw, 640px",
}: {
  project: Project;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const cover = project.coverImageUrl?.trim();

  if (cover) {
    return (
      <div
        className={cn(
          "border-border-base bg-bg-subtle rounded-card relative overflow-hidden border",
          className,
        )}
      >
        <Image
          src={cover}
          alt={`${project.title} screenshot`}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  const variant = VARIANTS[hash(project.slug) % VARIANTS.length];
  const mark = projectMark(project.title);
  const stack = project.technologies.slice(0, 4);

  return (
    <div
      className={cn(
        "border-border-base bg-bg-subtle rounded-card relative overflow-hidden border",
        className,
      )}
      aria-hidden
    >
      {/* Grid field */}
      <div className="bg-grid absolute inset-0" />

      {/* A single soft accent wash, angled per variant so cards differ */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `linear-gradient(${variant.rotate.replace("deg", "")}deg, color-mix(in srgb, var(--accent) 14%, transparent) ${variant.from}, transparent ${variant.to})`,
        }}
      />

      {/* Corner registration marks — a quiet technical detail */}
      <span className="border-border-strong absolute top-4 left-4 h-3 w-3 border-t border-l opacity-70" />
      <span className="border-border-strong absolute right-4 bottom-4 h-3 w-3 border-r border-b opacity-70" />

      <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
        <p className="label text-fg-subtle">{project.category}</p>

        <p className="text-fg/12 pointer-events-none font-mono text-[clamp(4rem,12vw,7rem)] leading-none font-medium tracking-tighter select-none">
          {mark}
        </p>

        {stack.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {stack.map((tech) => (
              <li
                key={tech}
                className="border-border-base bg-bg/70 text-fg-subtle rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none backdrop-blur-sm"
              >
                {tech}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
