"use client";

import { useEffect, useState } from "react";

export type CaseStudySection = { id: string; label: string };

/**
 * The sticky contents rail on a project page.
 *
 * A case study is long-form, so the rail answers two questions at once: how
 * much is left, and which part you are reading. It is progressive — the anchors
 * work without JavaScript, and the highlight is the only thing the observer
 * adds.
 */
export function CaseStudyNav({ sections }: { sections: CaseStudySection[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);

    if (targets.length === 0) return;

    // The band sits just under the floating nav; whatever heading is inside it
    // is what the reader is actually looking at.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );

    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav aria-label="Case study contents">
      <p className="label text-fg-subtle">Contents</p>
      <ol className="mt-4 space-y-1">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className="text-fg-muted hover:text-fg aria-[current=true]:text-fg group -mx-2 flex items-baseline gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-200"
            >
              <span className="text-fg-subtle group-aria-[current=true]:text-accent font-mono text-[11px] tabular-nums transition-colors duration-200">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="group-aria-[current=true]:font-medium">{section.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
