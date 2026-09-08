import { Suspense } from "react";

import { Hero } from "@/components/public/hero";
import { ContactSection, ResumeSection } from "@/components/public/contact-resume";
import {
  AboutSection,
  AchievementsSection,
  CertificationsSection,
  EducationSection,
  ExperienceSection,
  ProjectsSection,
  SkillsSection,
} from "@/components/public/sections";
import { SectionSkeleton } from "@/components/ui";
import { siteUrl } from "@/lib/env";
import {
  getAchievements,
  getCertifications,
  getEducation,
  getExperiences,
  getFeaturedProjects,
  getProfile,
  getPublishedProjects,
  getSiteSettings,
  getSkillGroups,
  getSocialLinks,
} from "@/services/portfolio";

/**
 * The homepage renders statically from tag-cached queries, so a visitor is
 * served HTML with no database round-trip on the request path.
 *
 * Each section below the fold is its own async Server Component behind a
 * `Suspense` boundary. On a cold render — the first request after a content
 * change — the hero and navigation stream immediately and the remaining
 * sections fill in as their queries resolve, instead of the whole page waiting
 * on the slowest one.
 */

export default async function HomePage() {
  const [profile, socialLinks] = await Promise.all([getProfile(), getSocialLinks()]);

  return (
    <>
      <Hero profile={profile} socialLinks={socialLinks} />

      <Suspense fallback={<SectionSkeleton rows={2} />}>
        <About />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={2} />}>
        <Skills />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={3} />}>
        <Experience />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={2} />}>
        <Projects />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={2} />}>
        <EducationBlock />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={2} />}>
        <Certifications />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={2} />}>
        <Achievements />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={1} />}>
        <Resume />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={3} />}>
        <Contact />
      </Suspense>

      <Suspense fallback={null}>
        <StructuredData />
      </Suspense>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Streamed sections                                                           */
/* -------------------------------------------------------------------------- */

async function About() {
  return <AboutSection profile={await getProfile()} />;
}

async function Skills() {
  return <SkillsSection groups={await getSkillGroups()} />;
}

async function Experience() {
  return <ExperienceSection experiences={await getExperiences()} />;
}

async function Projects() {
  const [featured, all] = await Promise.all([getFeaturedProjects(), getPublishedProjects()]);
  // Fall back to the most recent projects so the section is never empty just
  // because nothing has been marked featured yet.
  const shown = featured.length > 0 ? featured : all.slice(0, 4);
  return <ProjectsSection featured={shown} totalCount={all.length} />;
}

async function EducationBlock() {
  return <EducationSection education={await getEducation()} />;
}

async function Certifications() {
  return <CertificationsSection certifications={await getCertifications()} />;
}

async function Achievements() {
  return <AchievementsSection achievements={await getAchievements()} />;
}

async function Resume() {
  return <ResumeSection profile={await getProfile()} />;
}

async function Contact() {
  const [profile, socialLinks, settings] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getSiteSettings(),
  ]);
  return <ContactSection profile={profile} socialLinks={socialLinks} settings={settings} />;
}

/* -------------------------------------------------------------------------- */
/* Structured data                                                             */
/* -------------------------------------------------------------------------- */

/**
 * schema.org Person markup, built from the database so it stays in step with
 * the visible content. Rendered last because search engines read the parsed
 * document, not the streaming order.
 */
async function StructuredData() {
  const [profile, socialLinks, skillGroups, education] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getSkillGroups(),
    getEducation(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    url: siteUrl(),
    jobTitle: profile.headline || undefined,
    description: profile.summary || profile.introduction || undefined,
    email: profile.email ? `mailto:${profile.email}` : undefined,
    image: profile.avatarUrl || undefined,
    address: profile.location
      ? { "@type": "PostalAddress", addressLocality: profile.location }
      : undefined,
    sameAs: socialLinks.map((link) => link.url).filter((url) => url.startsWith("http")),
    knowsAbout: skillGroups.flatMap((group) => group.skills.map((skill) => skill.name)),
    alumniOf: education.map((item) => ({
      "@type": "EducationalOrganization",
      name: item.institution,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped below; `<` cannot terminate the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
