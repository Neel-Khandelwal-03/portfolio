import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/* Shared column helpers                                                       */
/* -------------------------------------------------------------------------- */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

const emptyTextArray = sql`ARRAY[]::text[]`;

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).notNull().default("Admin"),
    passwordHash: text("password_hash").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("admin_users_email_key").on(t.email)],
);

/**
 * Sessions store only a SHA-256 hash of the opaque session token, so a database
 * dump cannot be replayed as a valid login.
 */
export const sessions = pgTable(
  "sessions",
  {
    tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: varchar("user_agent", { length: 400 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Media registry                                                              */
/* -------------------------------------------------------------------------- */

export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    url: text("url").notNull(),
    pathname: text("pathname").notNull(),
    provider: varchar("provider", { length: 24 }).notNull().default("local"),
    contentType: varchar("content_type", { length: 120 }).notNull(),
    size: integer("size").notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    kind: varchar("kind", { length: 24 }).notNull().default("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_created_at_idx").on(t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Profile (single row, id = 1)                                                */
/* -------------------------------------------------------------------------- */

export const profile = pgTable("profile", {
  id: integer("id").primaryKey().default(1),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  headline: varchar("headline", { length: 240 }).notNull().default(""),
  introduction: text("introduction").notNull().default(""),
  summary: text("summary").notNull().default(""),
  careerInterests: text("career_interests").notNull().default(""),
  technicalInterests: text("technical_interests").notNull().default(""),
  currentFocus: text("current_focus").notNull().default(""),
  email: varchar("email", { length: 255 }).notNull().default(""),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  location: varchar("location", { length: 160 }).notNull().default(""),
  avatarUrl: text("avatar_url"),
  resumeUrl: text("resume_url"),
  resumeUpdatedAt: timestamp("resume_updated_at", { withTimezone: true }),
  availableForWork: boolean("available_for_work").notNull().default(true),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/* Skills                                                                      */
/* -------------------------------------------------------------------------- */

export const skillCategories = pgTable(
  "skill_categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("skill_categories_slug_key").on(t.slug)],
);

export const skills = pgTable(
  "skills",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => skillCategories.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    /** 1-5, optional emphasis shown in the admin only. */
    proficiency: integer("proficiency"),
    isVisible: boolean("is_visible").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("skills_category_id_idx").on(t.categoryId, t.displayOrder)],
);

/* -------------------------------------------------------------------------- */
/* Projects                                                                    */
/* -------------------------------------------------------------------------- */

export type Screenshot = { url: string; caption?: string };

/** A measured outcome, e.g. `{ value: "42→11 min", label: "nightly runtime" }`. */
export type ProjectMetric = { value: string; label: string };

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    summary: varchar("summary", { length: 400 }).notNull().default(""),
    description: text("description").notNull().default(""),
    category: varchar("category", { length: 80 }).notNull().default("Web"),
    technologies: text("technologies").array().notNull().default(emptyTextArray),
    githubUrl: text("github_url"),
    liveUrl: text("live_url"),
    coverImageUrl: text("cover_image_url"),
    screenshots: jsonb("screenshots")
      .$type<Screenshot[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    metrics: jsonb("metrics")
      .$type<ProjectMetric[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    // Case-study sections. Each is optional; the public page renders only the
    // ones that have been filled in, so older projects keep their old shape.
    problem: text("problem").notNull().default(""),
    approach: text("approach").notNull().default(""),
    architecture: text("architecture").notNull().default(""),
    results: text("results").notNull().default(""),
    learned: text("learned").notNull().default(""),
    isFeatured: boolean("is_featured").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(true),
    startDate: date("start_date"),
    endDate: date("end_date"),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("projects_slug_key").on(t.slug),
    index("projects_published_order_idx").on(t.isPublished, t.displayOrder),
    index("projects_featured_idx").on(t.isFeatured),
  ],
);

/* -------------------------------------------------------------------------- */
/* Experience                                                                  */
/* -------------------------------------------------------------------------- */

export const experiences = pgTable(
  "experiences",
  {
    id: serial("id").primaryKey(),
    company: varchar("company", { length: 200 }).notNull(),
    role: varchar("role", { length: 200 }).notNull(),
    employmentType: varchar("employment_type", { length: 60 }).notNull().default("Internship"),
    location: varchar("location", { length: 160 }).notNull().default(""),
    startDate: date("start_date").notNull(),
    /** null means "Present". */
    endDate: date("end_date"),
    description: text("description").notNull().default(""),
    responsibilities: text("responsibilities").array().notNull().default(emptyTextArray),
    achievements: text("achievements").array().notNull().default(emptyTextArray),
    technologies: text("technologies").array().notNull().default(emptyTextArray),
    logoUrl: text("logo_url"),
    certificateUrl: text("certificate_url"),
    isPublished: boolean("is_published").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("experiences_order_idx").on(t.isPublished, t.displayOrder)],
);

/* -------------------------------------------------------------------------- */
/* Education                                                                   */
/* -------------------------------------------------------------------------- */

export const education = pgTable(
  "education",
  {
    id: serial("id").primaryKey(),
    institution: varchar("institution", { length: 200 }).notNull(),
    degree: varchar("degree", { length: 200 }).notNull(),
    field: varchar("field", { length: 200 }).notNull().default(""),
    location: varchar("location", { length: 160 }).notNull().default(""),
    startDate: date("start_date"),
    endDate: date("end_date"),
    grade: varchar("grade", { length: 80 }).notNull().default(""),
    description: text("description").notNull().default(""),
    achievements: text("achievements").array().notNull().default(emptyTextArray),
    logoUrl: text("logo_url"),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("education_order_idx").on(t.displayOrder)],
);

/* -------------------------------------------------------------------------- */
/* Certifications                                                              */
/* -------------------------------------------------------------------------- */

export const certifications = pgTable(
  "certifications",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 240 }).notNull(),
    issuer: varchar("issuer", { length: 200 }).notNull(),
    issueDate: date("issue_date"),
    expiryDate: date("expiry_date"),
    credentialId: varchar("credential_id", { length: 200 }),
    credentialUrl: text("credential_url"),
    fileUrl: text("file_url"),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("certifications_order_idx").on(t.displayOrder)],
);

/* -------------------------------------------------------------------------- */
/* Achievements                                                                */
/* -------------------------------------------------------------------------- */

export const achievements = pgTable(
  "achievements",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description").notNull().default(""),
    organization: varchar("organization", { length: 200 }).notNull().default(""),
    date: date("date"),
    url: text("url"),
    fileUrl: text("file_url"),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("achievements_order_idx").on(t.displayOrder)],
);

/* -------------------------------------------------------------------------- */
/* Social links                                                                */
/* -------------------------------------------------------------------------- */

export const socialLinks = pgTable(
  "social_links",
  {
    id: serial("id").primaryKey(),
    label: varchar("label", { length: 80 }).notNull(),
    /** Matches an inline icon key: github | linkedin | email | x | website ... */
    platform: varchar("platform", { length: 40 }).notNull().default("website"),
    url: text("url").notNull(),
    isVisible: boolean("is_visible").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("social_links_order_idx").on(t.displayOrder)],
);

/* -------------------------------------------------------------------------- */
/* Site settings (single row, id = 1)                                          */
/* -------------------------------------------------------------------------- */

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  siteTitle: varchar("site_title", { length: 200 }).notNull().default(""),
  siteDescription: varchar("site_description", { length: 400 }).notNull().default(""),
  seoKeywords: text("seo_keywords").array().notNull().default(emptyTextArray),
  ogImageUrl: text("og_image_url"),
  footerText: varchar("footer_text", { length: 300 }).notNull().default(""),
  contactFormEnabled: boolean("contact_form_enabled").notNull().default(true),
  analyticsEnabled: boolean("analytics_enabled").notNull().default(true),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/* Contact messages                                                            */
/* -------------------------------------------------------------------------- */

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contact_messages_created_at_idx").on(t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Analytics events (lightweight, first-party)                                 */
/* -------------------------------------------------------------------------- */

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 60 }).notNull(),
    detail: varchar("detail", { length: 240 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("analytics_events_name_idx").on(t.name, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                   */
/* -------------------------------------------------------------------------- */

export const skillCategoriesRelations = relations(skillCategories, ({ many }) => ({
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  category: one(skillCategories, {
    fields: [skills.categoryId],
    references: [skillCategories.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(adminUsers, { fields: [sessions.userId], references: [adminUsers.id] }),
}));

/* -------------------------------------------------------------------------- */
/* Inferred types                                                              */
/* -------------------------------------------------------------------------- */

export type AdminUser = typeof adminUsers.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type SkillCategory = typeof skillCategories.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Education = typeof education.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type SocialLink = typeof socialLinks.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type MediaItem = typeof media.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
