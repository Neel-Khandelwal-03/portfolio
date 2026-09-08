import "./load-env";

import { randomBytes } from "node:crypto";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { hashPassword } from "../src/lib/password";
import * as s from "../src/db/schema";

/**
 * Seeds the initial portfolio.
 *
 * Everything written here is editable from /admin afterwards — this only exists
 * so a fresh database is not an empty screen. Items marked PLACEHOLDER are
 * generic examples that should be replaced with real content.
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
const client = postgres(url, { max: 1, ssl: isLocal ? false : "require" });
const db = drizzle(client, { schema: s });

async function main() {
  console.log("Seeding database...");

  /* ---------------------------------------------------------------- admin */
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();

  const existingAdmin = await db.select().from(s.adminUsers).limit(1);
  if (existingAdmin.length === 0) {
    // Never fall back to a hard-coded password: a known default that reached
    // production would be an open door. If none is supplied, generate one and
    // print it exactly once.
    const generated = !process.env.ADMIN_PASSWORD;
    const adminPassword = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");

    if (adminPassword.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
    }

    await db.insert(s.adminUsers).values({
      email: adminEmail,
      name: "Neel Khandelwal",
      passwordHash: await hashPassword(adminPassword),
    });

    console.log(`  admin user created: ${adminEmail}`);
    if (generated) {
      console.log(`  generated password (shown once, save it now): ${adminPassword}`);
    }
  } else {
    console.log("  admin user already exists, left untouched");
  }

  /* -------------------------------------------------------------- profile */
  await db
    .insert(s.profile)
    .values({
      id: 1,
      fullName: "Neel Khandelwal",
      headline: "Software Engineer — Full-Stack & Data",
      introduction:
        "I build fast, reliable web applications and turn messy data into decisions. " +
        "Currently focused on full-stack TypeScript systems and applied machine learning.",
      summary:
        "Software engineer with a foundation in systems programming, full-stack web development " +
        "and applied data analysis. I enjoy the whole path from a relational schema to the " +
        "interface someone actually uses — designing the data model, writing the API, and " +
        "shipping an accessible, fast front end on top of it.",
      careerInterests:
        "Software engineering, full-stack and backend roles, and data/ML positions where " +
        "engineering rigour matters as much as modelling.",
      technicalInterests:
        "Distributed systems, database design and query performance, web performance budgets, " +
        "statistical inference, and the engineering discipline around putting models in production.",
      currentFocus:
        "Deepening my TypeScript and PostgreSQL work, studying system design, and building " +
        "end-to-end projects that pair a real database with a production-grade front end.",
      email: adminEmail,
      location: "India",
      availableForWork: true,
    })
    .onConflictDoNothing();

  /* --------------------------------------------------------- site settings */
  await db
    .insert(s.siteSettings)
    .values({
      id: 1,
      siteTitle: "Neel Khandelwal — Software Engineer",
      siteDescription:
        "Portfolio of Neel Khandelwal: software engineer working across full-stack " +
        "TypeScript, backend systems and applied data science.",
      seoKeywords: [
        "Neel Khandelwal",
        "software engineer",
        "full-stack developer",
        "backend developer",
        "frontend developer",
        "data science",
        "machine learning",
        "TypeScript",
        "Next.js",
        "Python",
      ],
      footerText: "Built with Next.js, TypeScript and PostgreSQL.",
      contactFormEnabled: true,
      analyticsEnabled: true,
    })
    .onConflictDoNothing();

  /* --------------------------------------------------------- social links */
  const existingSocial = await db.select().from(s.socialLinks).limit(1);
  if (existingSocial.length === 0) {
    await db.insert(s.socialLinks).values([
      {
        label: "GitHub",
        platform: "github",
        url: "https://github.com/neelkhandelwal",
        displayOrder: 0,
      },
      {
        label: "LinkedIn",
        platform: "linkedin",
        url: "https://www.linkedin.com/in/neelkhandelwal",
        displayOrder: 1,
      },
      { label: "Email", platform: "email", url: `mailto:${adminEmail}`, displayOrder: 2 },
    ]);
  }

  /* ---------------------------------------------------------------- skills */
  const existingCategories = await db.select().from(s.skillCategories).limit(1);
  if (existingCategories.length === 0) {
    const categoryData = [
      {
        name: "Programming",
        slug: "programming",
        skills: ["C++", "Python", "JavaScript", "TypeScript", "SQL"],
      },
      {
        name: "Web Development",
        slug: "web-development",
        skills: ["HTML", "CSS", "React", "Next.js", "Node.js", "REST APIs"],
      },
      {
        name: "Data & ML",
        slug: "data-ml",
        skills: [
          "Pandas",
          "NumPy",
          "SciPy",
          "Scikit-learn",
          "Exploratory Data Analysis",
          "Statistical Hypothesis Testing",
        ],
      },
      {
        name: "Tools",
        slug: "tools",
        skills: ["Git", "GitHub", "Docker", "Tableau", "PostgreSQL"],
      },
    ];

    for (const [index, category] of categoryData.entries()) {
      const [row] = await db
        .insert(s.skillCategories)
        .values({ name: category.name, slug: category.slug, displayOrder: index })
        .returning();

      await db.insert(s.skills).values(
        category.skills.map((name, i) => ({
          categoryId: row.id,
          name,
          displayOrder: i,
        })),
      );
    }
  }

  /* -------------------------------------------------------------- projects */
  const existingProjects = await db.select().from(s.projects).limit(1);
  if (existingProjects.length === 0) {
    await db.insert(s.projects).values([
      {
        title: "Portfolio CMS",
        slug: "portfolio-cms",
        summary:
          "A database-backed personal portfolio with a private admin dashboard — every section " +
          "is editable without touching the source.",
        description:
          "This site. A Next.js App Router application where all public content is stored in " +
          "PostgreSQL and managed through a private CMS.\n\n" +
          "The public pages are statically rendered from tag-cached queries, so a visitor never " +
          "waits on a database round-trip. When content changes in the dashboard the affected " +
          "cache tags are revalidated, and the public site updates within seconds without a " +
          "rebuild or redeploy.\n\n" +
          "Authentication is built on Node's scrypt with opaque, database-backed sessions: only a " +
          "SHA-256 hash of each session token is stored, so a database dump cannot be replayed " +
          "as a login. File uploads go to object storage behind a validating adapter rather than " +
          "into Postgres.",
        category: "Full-Stack",
        technologies: ["Next.js", "TypeScript", "PostgreSQL", "Drizzle ORM", "Tailwind CSS", "Zod"],
        githubUrl: "https://github.com/neelkhandelwal/portfolio",
        isFeatured: true,
        isPublished: true,
        displayOrder: 0,
      },
      {
        title: "PLACEHOLDER — Data Analysis Project",
        slug: "placeholder-data-analysis",
        summary:
          "Replace this with a real data project: the question you asked, the dataset, the " +
          "method, and what you found.",
        description:
          "PLACEHOLDER CONTENT — edit or delete this from /admin/projects.\n\n" +
          "A strong write-up for a data project usually covers: the question, where the data " +
          "came from and how it was cleaned, the exploratory findings, the statistical test or " +
          "model applied, how it was validated, and the conclusion with its caveats.",
        category: "Data / ML",
        technologies: ["Python", "Pandas", "NumPy", "Scikit-learn", "Matplotlib"],
        isFeatured: true,
        isPublished: true,
        displayOrder: 1,
      },
      {
        title: "PLACEHOLDER — Backend Service",
        slug: "placeholder-backend-service",
        summary:
          "Replace this with a backend project: the API you designed, the data model, and the " +
          "performance or reliability problem it solves.",
        description:
          "PLACEHOLDER CONTENT — edit or delete this from /admin/projects.\n\n" +
          "Useful things to cover: the domain model, endpoint design, authentication, how state " +
          "is persisted, caching, and any load or failure characteristics you measured.",
        category: "Backend",
        technologies: ["Node.js", "TypeScript", "PostgreSQL", "Docker", "REST APIs"],
        isFeatured: false,
        isPublished: true,
        displayOrder: 2,
      },
    ]);
  }

  /* ------------------------------------------------------------ experience */
  const existingExperience = await db.select().from(s.experiences).limit(1);
  if (existingExperience.length === 0) {
    await db.insert(s.experiences).values([
      {
        company: "PLACEHOLDER — Company Name",
        role: "Software Engineering Intern",
        employmentType: "Internship",
        location: "Remote",
        startDate: "2025-05-01",
        endDate: "2025-07-31",
        description:
          "PLACEHOLDER CONTENT — edit this from /admin/experience and replace it with your " +
          "actual internship.",
        responsibilities: [
          "Describe what you were responsible for day to day.",
          "Name the systems or services you worked on.",
        ],
        achievements: [
          "Quantify an outcome where you can — latency, coverage, adoption, or time saved.",
        ],
        technologies: ["TypeScript", "React", "Node.js", "PostgreSQL"],
        isPublished: true,
        displayOrder: 0,
      },
    ]);
  }

  /* ------------------------------------------------------------- education */
  const existingEducation = await db.select().from(s.education).limit(1);
  if (existingEducation.length === 0) {
    await db.insert(s.education).values([
      {
        institution: "PLACEHOLDER — University Name",
        degree: "B.Tech",
        field: "Computer Science and Engineering",
        location: "India",
        startDate: "2022-08-01",
        endDate: "2026-06-30",
        grade: "CGPA — add yours",
        description:
          "PLACEHOLDER CONTENT — edit this from /admin/education. Mention relevant coursework " +
          "such as data structures, algorithms, databases, operating systems and statistics.",
        achievements: ["Add scholarships, ranks or notable coursework here."],
        displayOrder: 0,
      },
    ]);
  }

  /* -------------------------------------------------------- certifications */
  const existingCerts = await db.select().from(s.certifications).limit(1);
  if (existingCerts.length === 0) {
    await db.insert(s.certifications).values([
      {
        name: "PLACEHOLDER — Certification Name",
        issuer: "Issuing Organisation",
        issueDate: "2025-01-15",
        credentialId: "ABC-123456",
        credentialUrl: "https://example.com/verify/ABC-123456",
        displayOrder: 0,
      },
    ]);
  }

  /* ---------------------------------------------------------- achievements */
  const existingAchievements = await db.select().from(s.achievements).limit(1);
  if (existingAchievements.length === 0) {
    await db.insert(s.achievements).values([
      {
        title: "PLACEHOLDER — Achievement",
        description:
          "Edit this from /admin/achievements. Hackathon placements, competitive programming " +
          "ratings, published work and open-source contributions all belong here.",
        organization: "Organisation",
        date: "2025-03-01",
        displayOrder: 0,
      },
    ]);
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
