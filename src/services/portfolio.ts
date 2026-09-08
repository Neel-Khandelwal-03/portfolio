import "server-only";

import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import * as t from "@/db/schema";
import { TAGS, cachedQuery } from "@/lib/cache";

/**
 * The data-access layer.
 *
 * This is the only module that touches Drizzle. Server actions and route
 * handlers call into it; UI components never import `@/db` directly.
 *
 * Public reads are wrapped in `cachedQuery` so the statically rendered
 * portfolio never hits Postgres on a request. Admin reads are deliberately
 * uncached — the person editing must always see the true current state.
 */

/* ========================================================================== */
/* Profile                                                                     */
/* ========================================================================== */

const DEFAULT_PROFILE = {
  id: 1,
  fullName: "Neel Khandelwal",
  headline: "",
  introduction: "",
  summary: "",
  careerInterests: "",
  technicalInterests: "",
  currentFocus: "",
  email: "",
  phone: "",
  location: "",
  avatarUrl: null,
  resumeUrl: null,
  resumeUpdatedAt: null,
  availableForWork: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies t.Profile;

async function readProfile(): Promise<t.Profile> {
  const [row] = await db.select().from(t.profile).where(eq(t.profile.id, 1)).limit(1);
  return row ?? DEFAULT_PROFILE;
}

export const getProfile = cachedQuery(readProfile, ["profile"], [TAGS.profile]);
export const getProfileForAdmin = readProfile;

export async function updateProfile(values: Partial<t.Profile>): Promise<t.Profile> {
  const [row] = await db
    .insert(t.profile)
    .values({ ...DEFAULT_PROFILE, ...values, id: 1 })
    .onConflictDoUpdate({
      target: t.profile.id,
      set: { ...values, updatedAt: new Date() },
    })
    .returning();
  return row;
}

/* ========================================================================== */
/* Site settings                                                               */
/* ========================================================================== */

const DEFAULT_SETTINGS = {
  id: 1,
  siteTitle: "Neel Khandelwal",
  siteDescription: "",
  seoKeywords: [] as string[],
  ogImageUrl: null,
  footerText: "",
  contactFormEnabled: true,
  analyticsEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies t.SiteSettings;

async function readSettings(): Promise<t.SiteSettings> {
  const [row] = await db.select().from(t.siteSettings).where(eq(t.siteSettings.id, 1)).limit(1);
  return row ?? DEFAULT_SETTINGS;
}

export const getSiteSettings = cachedQuery(readSettings, ["site-settings"], [TAGS.settings]);
export const getSiteSettingsForAdmin = readSettings;

export async function updateSiteSettings(values: Partial<t.SiteSettings>): Promise<t.SiteSettings> {
  const [row] = await db
    .insert(t.siteSettings)
    .values({ ...DEFAULT_SETTINGS, ...values, id: 1 })
    .onConflictDoUpdate({
      target: t.siteSettings.id,
      set: { ...values, updatedAt: new Date() },
    })
    .returning();
  return row;
}

/* ========================================================================== */
/* Skills                                                                      */
/* ========================================================================== */

export type SkillGroup = t.SkillCategory & { skills: t.Skill[] };

async function readSkillGroups(includeHidden: boolean): Promise<SkillGroup[]> {
  const categories = await db
    .select()
    .from(t.skillCategories)
    .orderBy(asc(t.skillCategories.displayOrder), asc(t.skillCategories.id));

  if (categories.length === 0) return [];

  // One query for every skill, grouped in memory — cheaper than N queries and
  // the row count here is inherently small.
  const rows = await db
    .select()
    .from(t.skills)
    .where(includeHidden ? undefined : eq(t.skills.isVisible, true))
    .orderBy(asc(t.skills.displayOrder), asc(t.skills.id));

  const byCategory = new Map<number, t.Skill[]>();
  for (const skill of rows) {
    const list = byCategory.get(skill.categoryId);
    if (list) list.push(skill);
    else byCategory.set(skill.categoryId, [skill]);
  }

  return categories.map((category) => ({
    ...category,
    skills: byCategory.get(category.id) ?? [],
  }));
}

export const getSkillGroups = cachedQuery(
  () => readSkillGroups(false),
  ["skill-groups"],
  [TAGS.skills],
);
export const getSkillGroupsForAdmin = () => readSkillGroups(true);

export function listSkillCategories() {
  return db
    .select()
    .from(t.skillCategories)
    .orderBy(asc(t.skillCategories.displayOrder), asc(t.skillCategories.id));
}

export async function createSkillCategory(values: typeof t.skillCategories.$inferInsert) {
  const [row] = await db.insert(t.skillCategories).values(values).returning();
  return row;
}

export async function updateSkillCategory(
  id: number,
  values: Partial<typeof t.skillCategories.$inferInsert>,
) {
  const [row] = await db
    .update(t.skillCategories)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(t.skillCategories.id, id))
    .returning();
  return row ?? null;
}

export async function deleteSkillCategory(id: number) {
  const [row] = await db.delete(t.skillCategories).where(eq(t.skillCategories.id, id)).returning();
  return row ?? null;
}

export async function createSkill(values: typeof t.skills.$inferInsert) {
  const [row] = await db.insert(t.skills).values(values).returning();
  return row;
}

export async function getSkill(id: number) {
  const [row] = await db.select().from(t.skills).where(eq(t.skills.id, id)).limit(1);
  return row ?? null;
}

export async function updateSkill(id: number, values: Partial<typeof t.skills.$inferInsert>) {
  const [row] = await db
    .update(t.skills)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(t.skills.id, id))
    .returning();
  return row ?? null;
}

export async function deleteSkill(id: number) {
  const [row] = await db.delete(t.skills).where(eq(t.skills.id, id)).returning();
  return row ?? null;
}

/* ========================================================================== */
/* Projects                                                                    */
/* ========================================================================== */

async function readProjects(): Promise<t.Project[]> {
  return db
    .select()
    .from(t.projects)
    .where(eq(t.projects.isPublished, true))
    .orderBy(asc(t.projects.displayOrder), desc(t.projects.id));
}

export const getPublishedProjects = cachedQuery(readProjects, ["projects"], [TAGS.projects]);

export const getFeaturedProjects = cachedQuery(
  async () =>
    db
      .select()
      .from(t.projects)
      .where(and(eq(t.projects.isPublished, true), eq(t.projects.isFeatured, true)))
      .orderBy(asc(t.projects.displayOrder), desc(t.projects.id)),
  ["projects", "featured"],
  [TAGS.projects],
);

export const getProjectBySlug = cachedQuery(
  async (slug: string) => {
    const [row] = await db
      .select()
      .from(t.projects)
      .where(and(eq(t.projects.slug, slug), eq(t.projects.isPublished, true)))
      .limit(1);
    return row ?? null;
  },
  ["project-by-slug"],
  [TAGS.projects],
);

export const getPublishedProjectSlugs = cachedQuery(
  async () =>
    db
      .select({ slug: t.projects.slug, updatedAt: t.projects.updatedAt })
      .from(t.projects)
      .where(eq(t.projects.isPublished, true)),
  ["project-slugs"],
  [TAGS.projects],
);

export function listProjectsForAdmin() {
  return db.select().from(t.projects).orderBy(asc(t.projects.displayOrder), desc(t.projects.id));
}

export async function getProjectById(id: number) {
  const [row] = await db.select().from(t.projects).where(eq(t.projects.id, id)).limit(1);
  return row ?? null;
}

export async function isSlugTaken(slug: string, exceptId?: number) {
  const rows = await db
    .select({ id: t.projects.id })
    .from(t.projects)
    .where(
      exceptId
        ? and(eq(t.projects.slug, slug), ne(t.projects.id, exceptId))
        : eq(t.projects.slug, slug),
    )
    .limit(1);
  return rows.length > 0;
}

export async function createProject(values: typeof t.projects.$inferInsert) {
  const [row] = await db.insert(t.projects).values(values).returning();
  return row;
}

export async function updateProject(id: number, values: Partial<typeof t.projects.$inferInsert>) {
  const [row] = await db
    .update(t.projects)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(t.projects.id, id))
    .returning();
  return row ?? null;
}

export async function deleteProject(id: number) {
  const [row] = await db.delete(t.projects).where(eq(t.projects.id, id)).returning();
  return row ?? null;
}

/* ========================================================================== */
/* Experience                                                                  */
/* ========================================================================== */

export const getExperiences = cachedQuery(
  async () =>
    db
      .select()
      .from(t.experiences)
      .where(eq(t.experiences.isPublished, true))
      .orderBy(asc(t.experiences.displayOrder), desc(t.experiences.startDate)),
  ["experiences"],
  [TAGS.experiences],
);

export function listExperiencesForAdmin() {
  return db
    .select()
    .from(t.experiences)
    .orderBy(asc(t.experiences.displayOrder), desc(t.experiences.startDate));
}

export async function getExperienceById(id: number) {
  const [row] = await db.select().from(t.experiences).where(eq(t.experiences.id, id)).limit(1);
  return row ?? null;
}

export async function createExperience(values: typeof t.experiences.$inferInsert) {
  const [row] = await db.insert(t.experiences).values(values).returning();
  return row;
}

export async function updateExperience(
  id: number,
  values: Partial<typeof t.experiences.$inferInsert>,
) {
  const [row] = await db
    .update(t.experiences)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(t.experiences.id, id))
    .returning();
  return row ?? null;
}

export async function deleteExperience(id: number) {
  const [row] = await db.delete(t.experiences).where(eq(t.experiences.id, id)).returning();
  return row ?? null;
}

/* ========================================================================== */
/* Education                                                                   */
/* ========================================================================== */

export const getEducation = cachedQuery(
  async () =>
    db.select().from(t.education).orderBy(asc(t.education.displayOrder), desc(t.education.endDate)),
  ["education"],
  [TAGS.education],
);

export const listEducationForAdmin = () =>
  db.select().from(t.education).orderBy(asc(t.education.displayOrder), desc(t.education.endDate));

export async function getEducationById(id: number) {
  const [row] = await db.select().from(t.education).where(eq(t.education.id, id)).limit(1);
  return row ?? null;
}

export async function createEducation(values: typeof t.education.$inferInsert) {
  const [row] = await db.insert(t.education).values(values).returning();
  return row;
}

export async function updateEducation(
  id: number,
  values: Partial<typeof t.education.$inferInsert>,
) {
  const [row] = await db
    .update(t.education)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(t.education.id, id))
    .returning();
  return row ?? null;
}

export async function deleteEducation(id: number) {
  const [row] = await db.delete(t.education).where(eq(t.education.id, id)).returning();
  return row ?? null;
}

/* ========================================================================== */
/* Certifications                                                              */
/* ========================================================================== */

export const getCertifications = cachedQuery(
  async () =>
    db
      .select()
      .from(t.certifications)
      .orderBy(asc(t.certifications.displayOrder), desc(t.certifications.issueDate)),
  ["certifications"],
  [TAGS.certifications],
);

export const listCertificationsForAdmin = () =>
  db
    .select()
    .from(t.certifications)
    .orderBy(asc(t.certifications.displayOrder), desc(t.certifications.issueDate));

export async function getCertificationById(id: number) {
  const [row] = await db
    .select()
    .from(t.certifications)
    .where(eq(t.certifications.id, id))
    .limit(1);
  return row ?? null;
}

export async function createCertification(values: typeof t.certifications.$inferInsert) {
  const [row] = await db.insert(t.certifications).values(values).returning();
  return row;
}

export async function updateCertification(
  id: number,
  values: Partial<typeof t.certifications.$inferInsert>,
) {
  const [row] = await db
    .update(t.certifications)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(t.certifications.id, id))
    .returning();
  return row ?? null;
}

export async function deleteCertification(id: number) {
  const [row] = await db.delete(t.certifications).where(eq(t.certifications.id, id)).returning();
  return row ?? null;
}

/* ========================================================================== */
/* Achievements                                                                */
/* ========================================================================== */

export const getAchievements = cachedQuery(
  async () =>
    db
      .select()
      .from(t.achievements)
      .orderBy(asc(t.achievements.displayOrder), desc(t.achievements.date)),
  ["achievements"],
  [TAGS.achievements],
);

export const listAchievementsForAdmin = () =>
  db
    .select()
    .from(t.achievements)
    .orderBy(asc(t.achievements.displayOrder), desc(t.achievements.date));

export async function getAchievementById(id: number) {
  const [row] = await db.select().from(t.achievements).where(eq(t.achievements.id, id)).limit(1);
  return row ?? null;
}

export async function createAchievement(values: typeof t.achievements.$inferInsert) {
  const [row] = await db.insert(t.achievements).values(values).returning();
  return row;
}

export async function updateAchievement(
  id: number,
  values: Partial<typeof t.achievements.$inferInsert>,
) {
  const [row] = await db
    .update(t.achievements)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(t.achievements.id, id))
    .returning();
  return row ?? null;
}

export async function deleteAchievement(id: number) {
  const [row] = await db.delete(t.achievements).where(eq(t.achievements.id, id)).returning();
  return row ?? null;
}

/* ========================================================================== */
/* Social links                                                                */
/* ========================================================================== */

export const getSocialLinks = cachedQuery(
  async () =>
    db
      .select()
      .from(t.socialLinks)
      .where(eq(t.socialLinks.isVisible, true))
      .orderBy(asc(t.socialLinks.displayOrder), asc(t.socialLinks.id)),
  ["social-links"],
  [TAGS.socialLinks],
);

export const listSocialLinksForAdmin = () =>
  db.select().from(t.socialLinks).orderBy(asc(t.socialLinks.displayOrder), asc(t.socialLinks.id));

export async function getSocialLinkById(id: number) {
  const [row] = await db.select().from(t.socialLinks).where(eq(t.socialLinks.id, id)).limit(1);
  return row ?? null;
}

export async function createSocialLink(values: typeof t.socialLinks.$inferInsert) {
  const [row] = await db.insert(t.socialLinks).values(values).returning();
  return row;
}

export async function updateSocialLink(
  id: number,
  values: Partial<typeof t.socialLinks.$inferInsert>,
) {
  const [row] = await db
    .update(t.socialLinks)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(t.socialLinks.id, id))
    .returning();
  return row ?? null;
}

export async function deleteSocialLink(id: number) {
  const [row] = await db.delete(t.socialLinks).where(eq(t.socialLinks.id, id)).returning();
  return row ?? null;
}

/* ========================================================================== */
/* Media                                                                       */
/* ========================================================================== */

export async function recordMedia(values: typeof t.media.$inferInsert) {
  const [row] = await db.insert(t.media).values(values).returning();
  return row;
}

export const listMedia = () =>
  db.select().from(t.media).orderBy(desc(t.media.createdAt)).limit(200);

export async function getMediaById(id: number) {
  const [row] = await db.select().from(t.media).where(eq(t.media.id, id)).limit(1);
  return row ?? null;
}

export async function deleteMediaRecord(id: number) {
  const [row] = await db.delete(t.media).where(eq(t.media.id, id)).returning();
  return row ?? null;
}

/* ========================================================================== */
/* Contact messages                                                            */
/* ========================================================================== */

export async function createContactMessage(values: typeof t.contactMessages.$inferInsert) {
  const [row] = await db.insert(t.contactMessages).values(values).returning();
  return row;
}

export const listContactMessages = () =>
  db.select().from(t.contactMessages).orderBy(desc(t.contactMessages.createdAt)).limit(200);

export async function markContactMessageRead(id: number, isRead: boolean) {
  const [row] = await db
    .update(t.contactMessages)
    .set({ isRead })
    .where(eq(t.contactMessages.id, id))
    .returning();
  return row ?? null;
}

export async function deleteContactMessage(id: number) {
  const [row] = await db.delete(t.contactMessages).where(eq(t.contactMessages.id, id)).returning();
  return row ?? null;
}

/**
 * Rate limit helper for the public contact form: how many messages arrived from
 * anywhere in the last window. Cheap, index-backed, and good enough to stop a
 * naive flood without adding a Redis dependency.
 */
export async function countRecentContactMessages(sinceMinutes: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(t.contactMessages)
    .where(sql`${t.contactMessages.createdAt} > now() - make_interval(mins => ${sinceMinutes})`);
  return row?.count ?? 0;
}

/* ========================================================================== */
/* Analytics                                                                   */
/* ========================================================================== */

export async function recordAnalyticsEvent(name: string, detail: string | null) {
  await db.insert(t.analyticsEvents).values({ name, detail });
}

export async function getAnalyticsSummary(limit = 20) {
  return db
    .select({
      name: t.analyticsEvents.name,
      detail: t.analyticsEvents.detail,
      count: sql<number>`count(*)::int`,
    })
    .from(t.analyticsEvents)
    .groupBy(t.analyticsEvents.name, t.analyticsEvents.detail)
    .orderBy(sql`count(*) desc`)
    .limit(limit);
}

/* ========================================================================== */
/* Dashboard stats                                                             */
/* ========================================================================== */

export type DashboardStats = {
  projects: number;
  publishedProjects: number;
  experiences: number;
  skills: number;
  certifications: number;
  education: number;
  achievements: number;
  unreadMessages: number;
  lastUpdated: Date | null;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  // A single round-trip: counting six small tables with six queries would be
  // six network hops on a serverless connection.
  const [row] = await db.execute<{
    projects: number;
    published_projects: number;
    experiences: number;
    skills: number;
    certifications: number;
    education: number;
    achievements: number;
    unread_messages: number;
    last_updated: string | null;
  }>(sql`
    select
      (select count(*)::int from projects)                            as projects,
      (select count(*)::int from projects where is_published)         as published_projects,
      (select count(*)::int from experiences)                         as experiences,
      (select count(*)::int from skills)                              as skills,
      (select count(*)::int from certifications)                      as certifications,
      (select count(*)::int from education)                           as education,
      (select count(*)::int from achievements)                        as achievements,
      (select count(*)::int from contact_messages where not is_read)  as unread_messages,
      (
        select max(ts) from (
          select max(updated_at) as ts from projects
          union all select max(updated_at) from experiences
          union all select max(updated_at) from skills
          union all select max(updated_at) from education
          union all select max(updated_at) from certifications
          union all select max(updated_at) from achievements
          union all select max(updated_at) from profile
          union all select max(updated_at) from site_settings
          union all select max(updated_at) from social_links
        ) t
      )                                                               as last_updated
  `);

  return {
    projects: row?.projects ?? 0,
    publishedProjects: row?.published_projects ?? 0,
    experiences: row?.experiences ?? 0,
    skills: row?.skills ?? 0,
    certifications: row?.certifications ?? 0,
    education: row?.education ?? 0,
    achievements: row?.achievements ?? 0,
    unreadMessages: row?.unread_messages ?? 0,
    lastUpdated: row?.last_updated ? new Date(row.last_updated) : null,
  };
}

/* ========================================================================== */
/* Ordering                                                                    */
/* ========================================================================== */

type OrderableTable =
  | typeof t.projects
  | typeof t.experiences
  | typeof t.education
  | typeof t.certifications
  | typeof t.achievements
  | typeof t.socialLinks
  | typeof t.skills
  | typeof t.skillCategories;

/**
 * Swaps a row with its neighbour in display order.
 *
 * Rows are renumbered densely first so that ties (everything defaulting to 0)
 * cannot make the swap a no-op. Runs in one transaction so a failure mid-way
 * cannot leave the list half-renumbered.
 */
export async function moveInOrder(
  table: OrderableTable,
  id: number,
  direction: "up" | "down",
  scope?: { column: "categoryId"; value: number },
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const where =
      scope && "categoryId" in table
        ? eq((table as typeof t.skills).categoryId, scope.value)
        : undefined;

    const rows = await tx
      .select({ id: table.id, displayOrder: table.displayOrder })
      .from(table)
      .where(where)
      .orderBy(asc(table.displayOrder), asc(table.id));

    const index = rows.findIndex((r) => r.id === id);
    if (index === -1) return false;

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= rows.length) return false;

    const reordered = [...rows];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    for (const [position, row] of reordered.entries()) {
      if (row.displayOrder !== position) {
        await tx.update(table).set({ displayOrder: position }).where(eq(table.id, row.id));
      }
    }

    return true;
  });
}

/** Next display order for a new row, so additions land at the end of the list. */
export async function nextDisplayOrder(
  table: OrderableTable,
  scope?: { value: number },
): Promise<number> {
  const where =
    scope && "categoryId" in table
      ? eq((table as typeof t.skills).categoryId, scope.value)
      : undefined;

  const [row] = await db
    .select({ max: sql<number | null>`max(${table.displayOrder})` })
    .from(table)
    .where(where);

  return (row?.max ?? -1) + 1;
}
