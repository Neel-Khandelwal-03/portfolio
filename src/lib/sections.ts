import "server-only";

import { getAchievements, getCertifications } from "@/services/portfolio";

/**
 * Which portfolio sections actually render, in page order.
 *
 * Certifications and achievements render nothing at all when they have no
 * content, so they must not consume a section number or a navigation slot —
 * otherwise the numbering skips (…05, 07…) and the nav points at an anchor that
 * is not on the page.
 *
 * Both reads are tag-cached and are already requested by the sections
 * themselves, so asking for them here costs no extra database round-trip.
 */

export type SectionId =
  | "about"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications"
  | "achievements"
  | "contact";

/** Sections that always render, because they show an empty state of their own. */
const ALWAYS: SectionId[] = ["about", "skills", "experience", "projects", "education"];

export type SectionIndex = {
  /** Rendered sections, in order. */
  ids: SectionId[];
  /** The two-digit label for a section, e.g. "06". */
  numberOf: (id: SectionId) => string;
  has: (id: SectionId) => boolean;
};

export async function getSectionIndex(): Promise<SectionIndex> {
  const [certifications, achievements] = await Promise.all([
    getCertifications(),
    getAchievements(),
  ]);

  const ids: SectionId[] = [
    ...ALWAYS,
    ...(certifications.length > 0 ? (["certifications"] as SectionId[]) : []),
    ...(achievements.length > 0 ? (["achievements"] as SectionId[]) : []),
    "contact",
  ];

  return {
    ids,
    has: (id) => ids.includes(id),
    numberOf: (id) => {
      const position = ids.indexOf(id);
      // A section that is not in the list has no number rather than a wrong one.
      return position === -1 ? "" : String(position + 1).padStart(2, "0");
    },
  };
}
