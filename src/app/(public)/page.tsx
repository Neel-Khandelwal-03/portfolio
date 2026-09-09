import { Suspense } from "react";

import { Hero } from "@/components/public/hero";
import { ContactSection, ResumeStrip } from "@/components/public/contact-resume";
import {
  AboutSection,
  AchievementsSection,
  CertificationsSection,
  EducationSection,
  ExperienceSection,
  MarqueeStrip,
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
 * change — the hero streams immediately and the rest fills in as its queries
 * resolve, instead of the whole page waiting on the slowest one.
 */

export default async function HomePage() {
  const [profile, socialLinks, skillGroups] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getSkillGroups(),
  ]);

  // The hero's "Focus" list and the transition strip are both derived from
  // skill data that already exists — no new schema, no hardcoded copy.
  const focusAreas = skillGroups.map((group) => group.name).slice(0, 5);
  const strip = skillGroups.flatMap((group) => group.skills.map((s) => s.name)).slice(0, 8);

  return (
    <>
      <Hero profile={profile} socialLinks={socialLinks} focusAreas={focusAreas} />

      <MarqueeStrip items={strip} />

      <Suspense fallback={<SectionSkeleton rows={2} />}>
        <About />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={3} />}>
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

      <Suspense fallback={null}>
        <Certifications />
      </Suspense>

      <Suspense fallback={null}>
        <Achievements />
      </Suspense>

      <Suspense fallback={null}>
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

/**
 * Featured projects get the large alternating treatment; everything else falls
 * into the compact list beneath. Capped at three large blocks so the section
 * stays a showcase rather than an endless scroll.
 */
async function Projects() {
  const [featured, all] = await Promise.all([getFeaturedProjects(), getPublishedProjects()]);

  // With nothing marked featured, promote the first two so the section still
  // leads with something visual.
  const lead = (featured.length > 0 ? featured : all.slice(0, 2)).slice(0, 3);
  const leadIds = new Set(lead.map((p) => p.id));
  const rest = all.filter((p) => !leadIds.has(p.id)).slice(0, 6);

  return <ProjectsSection featured={lead} rest={rest} totalCount={all.length} />;
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
  return <ResumeStrip profile={await getProfile()} />;
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
 * the visible content.
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
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
