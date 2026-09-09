"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import {
  failure,
  fieldErrorsFrom,
  formDataToObject,
  success,
  type ActionState,
} from "@/lib/action-state";
import { TAGS, revalidateContent, revalidateProject, type CacheTag } from "@/lib/cache";
import {
  achievementSchema,
  certificationSchema,
  educationSchema,
  experienceSchema,
  profileSchema,
  projectSchema,
  resumeSchema,
  siteSettingsSchema,
  skillCategorySchema,
  skillSchema,
  socialLinkSchema,
} from "@/lib/validation";
import * as t from "@/db/schema";
import * as svc from "@/services/portfolio";

/**
 * Every admin mutation in one module.
 *
 * Each action follows the same four steps, in this order:
 *
 *   1. `requireAdmin()` — verified against the database, never the cookie alone.
 *   2. Zod validation of the submitted values.
 *   3. The write, through the service layer.
 *   4. Targeted cache revalidation for the tags that actually changed.
 *
 * Step 1 is what makes these safe to expose: a Server Action is a POST endpoint,
 * so skipping the check would leave the whole CMS writable by anyone.
 */

/* -------------------------------------------------------------------------- */
/* Shared plumbing                                                             */
/* -------------------------------------------------------------------------- */

/**
 * `useActionState` calls actions as `(previousState, formData)`, so every form
 * action here takes that shape even though the previous state is unused.
 */
type FormAction = (previous: ActionState, formData: FormData) => Promise<ActionState>;

/** Wraps an action with the auth check and a uniform error response. */
function adminAction(handler: (formData: FormData) => Promise<ActionState>): FormAction {
  return async (_previous, formData) => {
    await requireAdmin();

    try {
      return await handler(formData);
    } catch (error) {
      // `redirect()` and `notFound()` work by throwing; they must pass through.
      if (error instanceof Error && /NEXT_(REDIRECT|HTTP_ERROR_FALLBACK)/.test(error.message)) {
        throw error;
      }

      console.error("admin action failed:", error);
      return failure("Something went wrong while saving. Please try again.");
    }
  };
}

function parse<S extends z.ZodType>(
  schema: S,
  formData: FormData,
): { ok: true; data: z.infer<S> } | { ok: false; state: ActionState } {
  const result = schema.safeParse(formDataToObject(formData));

  if (!result.success) {
    return {
      ok: false,
      state: failure("Please correct the highlighted fields.", fieldErrorsFrom(result.error)),
    };
  }

  return { ok: true, data: result.data };
}

function id(formData: FormData): number {
  return Number(formData.get("id"));
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

export const saveProfile = adminAction(async (formData) => {
  const parsed = parse(profileSchema, formData);
  if (!parsed.ok) return parsed.state;

  await svc.updateProfile(parsed.data);
  revalidateContent([TAGS.profile]);

  return success("Profile saved. The public site is updated.");
});

export const saveResume = adminAction(async (formData) => {
  const parsed = parse(resumeSchema, formData);
  if (!parsed.ok) return parsed.state;

  await svc.updateProfile({
    resumeUrl: parsed.data.resumeUrl,
    resumeUpdatedAt: new Date(),
  });
  revalidateContent([TAGS.profile]);

  return success("Resume updated.");
});

export const removeResume = adminAction(async () => {
  await svc.updateProfile({ resumeUrl: null, resumeUpdatedAt: null });
  revalidateContent([TAGS.profile]);

  return success("Resume removed.");
});

/* -------------------------------------------------------------------------- */
/* Site settings                                                               */
/* -------------------------------------------------------------------------- */

export const saveSiteSettings = adminAction(async (formData) => {
  const parsed = parse(siteSettingsSchema, formData);
  if (!parsed.ok) return parsed.state;

  await svc.updateSiteSettings(parsed.data);
  revalidateContent([TAGS.settings]);

  return success("Site settings saved.");
});

/* -------------------------------------------------------------------------- */
/* Skills                                                                      */
/* -------------------------------------------------------------------------- */

export const createSkillCategory = adminAction(async (formData) => {
  const parsed = parse(skillCategorySchema, formData);
  if (!parsed.ok) return parsed.state;

  await svc.createSkillCategory({
    ...parsed.data,
    // Two categories may legitimately share a display name; the slug is an
    // internal key, so make it unique rather than rejecting the submission.
    slug: await svc.uniqueSkillCategorySlug(parsed.data.slug),
    displayOrder: await svc.nextDisplayOrder(t.skillCategories),
  });

  revalidateContent([TAGS.skills]);
  revalidatePath("/admin/skills");

  return success("Category added.");
});

export const updateSkillCategory = adminAction(async (formData) => {
  const parsed = parse(skillCategorySchema, formData);
  if (!parsed.ok) return parsed.state;

  const categoryId = id(formData);
  const updated = await svc.updateSkillCategory(categoryId, {
    ...parsed.data,
    slug: await svc.uniqueSkillCategorySlug(parsed.data.slug, categoryId),
  });

  if (!updated) return failure("That category no longer exists.");

  revalidateContent([TAGS.skills]);
  revalidatePath("/admin/skills");

  return success(`Renamed to "${updated.name}".`);
});

export async function deleteSkillCategoryAction(categoryId: number): Promise<ActionState> {
  await requireAdmin();

  try {
    const removed = await svc.deleteSkillCategory(categoryId);
    if (!removed) return failure("That category no longer exists.");

    revalidateContent([TAGS.skills]);
    return success(`"${removed.name}" and its skills were deleted.`);
  } catch (error) {
    console.error("deleteSkillCategory failed:", error);
    return failure("Could not delete the category.");
  }
}

export const createSkill = adminAction(async (formData) => {
  const parsed = parse(skillSchema, formData);
  if (!parsed.ok) return parsed.state;

  await svc.createSkill({
    ...parsed.data,
    displayOrder: await svc.nextDisplayOrder(t.skills, { value: parsed.data.categoryId }),
  });
  revalidateContent([TAGS.skills]);

  return success("Skill added.");
});

export const updateSkill = adminAction(async (formData) => {
  const parsed = parse(skillSchema, formData);
  if (!parsed.ok) return parsed.state;

  await svc.updateSkill(id(formData), parsed.data);
  revalidateContent([TAGS.skills]);

  return success("Skill updated.");
});

export async function deleteSkillAction(skillId: number): Promise<ActionState> {
  await requireAdmin();

  try {
    const removed = await svc.deleteSkill(skillId);
    if (!removed) return failure("That skill no longer exists.");

    revalidateContent([TAGS.skills]);
    return success(`"${removed.name}" deleted.`);
  } catch (error) {
    console.error("deleteSkill failed:", error);
    return failure("Could not delete the skill.");
  }
}

export async function moveSkillAction(
  skillId: number,
  direction: "up" | "down",
): Promise<ActionState> {
  await requireAdmin();

  const skill = await svc.getSkill(skillId);
  if (!skill) return failure("That skill no longer exists.");

  await svc.moveInOrder(t.skills, skillId, direction, {
    column: "categoryId",
    value: skill.categoryId,
  });
  revalidateContent([TAGS.skills]);
  revalidatePath("/admin/skills");

  return success("Order updated.");
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                    */
/* -------------------------------------------------------------------------- */

export const createProject = adminAction(async (formData) => {
  const parsed = parse(projectSchema, formData);
  if (!parsed.ok) return parsed.state;

  if (await svc.isSlugTaken(parsed.data.slug)) {
    return failure("Please correct the highlighted fields.", {
      slug: "Another project already uses this slug.",
    });
  }

  const created = await svc.createProject({
    ...parsed.data,
    displayOrder: await svc.nextDisplayOrder(t.projects),
  });

  revalidateProject([created.slug]);
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${created.id}?created=1`);
});

export const updateProject = adminAction(async (formData) => {
  const parsed = parse(projectSchema, formData);
  if (!parsed.ok) return parsed.state;

  const projectId = id(formData);
  const before = await svc.getProjectById(projectId);
  if (!before) return failure("That project no longer exists.");

  if (await svc.isSlugTaken(parsed.data.slug, projectId)) {
    return failure("Please correct the highlighted fields.", {
      slug: "Another project already uses this slug.",
    });
  }

  await svc.updateProject(projectId, parsed.data);

  // Revalidate both slugs: renaming a project leaves the old URL cached.
  revalidateProject([before.slug, parsed.data.slug]);
  revalidatePath("/admin/projects");

  return success("Project saved. The public site is updated.");
});

export async function deleteProjectAction(projectId: number): Promise<ActionState> {
  await requireAdmin();

  try {
    const removed = await svc.deleteProject(projectId);
    if (!removed) return failure("That project no longer exists.");

    revalidateProject([removed.slug]);
    revalidatePath("/admin/projects");

    return success(`"${removed.title}" deleted.`);
  } catch (error) {
    console.error("deleteProject failed:", error);
    return failure("Could not delete the project.");
  }
}

export async function moveProjectAction(
  projectId: number,
  direction: "up" | "down",
): Promise<ActionState> {
  await requireAdmin();

  await svc.moveInOrder(t.projects, projectId, direction);
  revalidateProject();
  revalidatePath("/admin/projects");

  return success("Order updated.");
}

/* -------------------------------------------------------------------------- */
/* Experience                                                                  */
/* -------------------------------------------------------------------------- */

export const createExperience = adminAction(async (formData) => {
  const parsed = parse(experienceSchema, formData);
  if (!parsed.ok) return parsed.state;

  const created = await svc.createExperience({
    ...parsed.data,
    displayOrder: await svc.nextDisplayOrder(t.experiences),
  });

  revalidateContent([TAGS.experiences]);
  revalidatePath("/admin/experience");
  redirect(`/admin/experience/${created.id}?created=1`);
});

export const updateExperience = adminAction(async (formData) => {
  const parsed = parse(experienceSchema, formData);
  if (!parsed.ok) return parsed.state;

  const updated = await svc.updateExperience(id(formData), parsed.data);
  if (!updated) return failure("That experience no longer exists.");

  revalidateContent([TAGS.experiences]);
  revalidatePath("/admin/experience");

  return success("Experience saved. The public site is updated.");
});

export async function deleteExperienceAction(experienceId: number): Promise<ActionState> {
  await requireAdmin();

  try {
    const removed = await svc.deleteExperience(experienceId);
    if (!removed) return failure("That experience no longer exists.");

    revalidateContent([TAGS.experiences]);
    revalidatePath("/admin/experience");

    return success(`${removed.role} at ${removed.company} deleted.`);
  } catch (error) {
    console.error("deleteExperience failed:", error);
    return failure("Could not delete the experience.");
  }
}

export async function moveExperienceAction(
  experienceId: number,
  direction: "up" | "down",
): Promise<ActionState> {
  await requireAdmin();

  await svc.moveInOrder(t.experiences, experienceId, direction);
  revalidateContent([TAGS.experiences]);
  revalidatePath("/admin/experience");

  return success("Order updated.");
}

/* -------------------------------------------------------------------------- */
/* Education                                                                   */
/* -------------------------------------------------------------------------- */

export const createEducation = adminAction(async (formData) => {
  const parsed = parse(educationSchema, formData);
  if (!parsed.ok) return parsed.state;

  const created = await svc.createEducation({
    ...parsed.data,
    displayOrder: await svc.nextDisplayOrder(t.education),
  });

  revalidateContent([TAGS.education]);
  revalidatePath("/admin/education");
  redirect(`/admin/education/${created.id}?created=1`);
});

export const updateEducation = adminAction(async (formData) => {
  const parsed = parse(educationSchema, formData);
  if (!parsed.ok) return parsed.state;

  const updated = await svc.updateEducation(id(formData), parsed.data);
  if (!updated) return failure("That entry no longer exists.");

  revalidateContent([TAGS.education]);
  revalidatePath("/admin/education");

  return success("Education saved.");
});

export async function deleteEducationAction(educationId: number): Promise<ActionState> {
  await requireAdmin();

  try {
    const removed = await svc.deleteEducation(educationId);
    if (!removed) return failure("That entry no longer exists.");

    revalidateContent([TAGS.education]);
    revalidatePath("/admin/education");

    return success(`"${removed.institution}" deleted.`);
  } catch (error) {
    console.error("deleteEducation failed:", error);
    return failure("Could not delete the entry.");
  }
}

export async function moveEducationAction(
  educationId: number,
  direction: "up" | "down",
): Promise<ActionState> {
  await requireAdmin();

  await svc.moveInOrder(t.education, educationId, direction);
  revalidateContent([TAGS.education]);
  revalidatePath("/admin/education");

  return success("Order updated.");
}

/* -------------------------------------------------------------------------- */
/* Certifications                                                              */
/* -------------------------------------------------------------------------- */

export const createCertification = adminAction(async (formData) => {
  const parsed = parse(certificationSchema, formData);
  if (!parsed.ok) return parsed.state;

  const created = await svc.createCertification({
    ...parsed.data,
    displayOrder: await svc.nextDisplayOrder(t.certifications),
  });

  revalidateContent([TAGS.certifications]);
  revalidatePath("/admin/certifications");
  redirect(`/admin/certifications/${created.id}?created=1`);
});

export const updateCertification = adminAction(async (formData) => {
  const parsed = parse(certificationSchema, formData);
  if (!parsed.ok) return parsed.state;

  const updated = await svc.updateCertification(id(formData), parsed.data);
  if (!updated) return failure("That certification no longer exists.");

  revalidateContent([TAGS.certifications]);
  revalidatePath("/admin/certifications");

  return success("Certification saved.");
});

export async function deleteCertificationAction(certificationId: number): Promise<ActionState> {
  await requireAdmin();

  try {
    const removed = await svc.deleteCertification(certificationId);
    if (!removed) return failure("That certification no longer exists.");

    revalidateContent([TAGS.certifications]);
    revalidatePath("/admin/certifications");

    return success(`"${removed.name}" deleted.`);
  } catch (error) {
    console.error("deleteCertification failed:", error);
    return failure("Could not delete the certification.");
  }
}

export async function moveCertificationAction(
  certificationId: number,
  direction: "up" | "down",
): Promise<ActionState> {
  await requireAdmin();

  await svc.moveInOrder(t.certifications, certificationId, direction);
  revalidateContent([TAGS.certifications]);
  revalidatePath("/admin/certifications");

  return success("Order updated.");
}

/* -------------------------------------------------------------------------- */
/* Achievements                                                                */
/* -------------------------------------------------------------------------- */

export const createAchievement = adminAction(async (formData) => {
  const parsed = parse(achievementSchema, formData);
  if (!parsed.ok) return parsed.state;

  const created = await svc.createAchievement({
    ...parsed.data,
    displayOrder: await svc.nextDisplayOrder(t.achievements),
  });

  revalidateContent([TAGS.achievements]);
  revalidatePath("/admin/achievements");
  redirect(`/admin/achievements/${created.id}?created=1`);
});

export const updateAchievement = adminAction(async (formData) => {
  const parsed = parse(achievementSchema, formData);
  if (!parsed.ok) return parsed.state;

  const updated = await svc.updateAchievement(id(formData), parsed.data);
  if (!updated) return failure("That achievement no longer exists.");

  revalidateContent([TAGS.achievements]);
  revalidatePath("/admin/achievements");

  return success("Achievement saved.");
});

export async function deleteAchievementAction(achievementId: number): Promise<ActionState> {
  await requireAdmin();

  try {
    const removed = await svc.deleteAchievement(achievementId);
    if (!removed) return failure("That achievement no longer exists.");

    revalidateContent([TAGS.achievements]);
    revalidatePath("/admin/achievements");

    return success(`"${removed.title}" deleted.`);
  } catch (error) {
    console.error("deleteAchievement failed:", error);
    return failure("Could not delete the achievement.");
  }
}

export async function moveAchievementAction(
  achievementId: number,
  direction: "up" | "down",
): Promise<ActionState> {
  await requireAdmin();

  await svc.moveInOrder(t.achievements, achievementId, direction);
  revalidateContent([TAGS.achievements]);
  revalidatePath("/admin/achievements");

  return success("Order updated.");
}

/* -------------------------------------------------------------------------- */
/* Social links                                                                */
/* -------------------------------------------------------------------------- */

export const createSocialLink = adminAction(async (formData) => {
  const parsed = parse(socialLinkSchema, formData);
  if (!parsed.ok) return parsed.state;

  await svc.createSocialLink({
    ...parsed.data,
    displayOrder: await svc.nextDisplayOrder(t.socialLinks),
  });

  revalidateContent([TAGS.socialLinks]);
  revalidatePath("/admin/social-links");

  return success("Link added.");
});

export const updateSocialLink = adminAction(async (formData) => {
  const parsed = parse(socialLinkSchema, formData);
  if (!parsed.ok) return parsed.state;

  const updated = await svc.updateSocialLink(id(formData), parsed.data);
  if (!updated) return failure("That link no longer exists.");

  revalidateContent([TAGS.socialLinks]);
  revalidatePath("/admin/social-links");

  return success("Link updated.");
});

export async function deleteSocialLinkAction(linkId: number): Promise<ActionState> {
  await requireAdmin();

  try {
    const removed = await svc.deleteSocialLink(linkId);
    if (!removed) return failure("That link no longer exists.");

    revalidateContent([TAGS.socialLinks]);
    revalidatePath("/admin/social-links");

    return success(`"${removed.label}" deleted.`);
  } catch (error) {
    console.error("deleteSocialLink failed:", error);
    return failure("Could not delete the link.");
  }
}

export async function moveSocialLinkAction(
  linkId: number,
  direction: "up" | "down",
): Promise<ActionState> {
  await requireAdmin();

  await svc.moveInOrder(t.socialLinks, linkId, direction);
  revalidateContent([TAGS.socialLinks]);
  revalidatePath("/admin/social-links");

  return success("Order updated.");
}

/* -------------------------------------------------------------------------- */
/* Messages & media                                                            */
/* -------------------------------------------------------------------------- */

export async function toggleMessageReadAction(
  messageId: number,
  isRead: boolean,
): Promise<ActionState> {
  await requireAdmin();

  await svc.markContactMessageRead(messageId, isRead);
  revalidatePath("/admin/messages");

  return success(isRead ? "Marked as read." : "Marked as unread.");
}

export async function deleteMessageAction(messageId: number): Promise<ActionState> {
  await requireAdmin();

  const removed = await svc.deleteContactMessage(messageId);
  if (!removed) return failure("That message no longer exists.");

  revalidatePath("/admin/messages");
  return success("Message deleted.");
}

export async function deleteMediaAction(mediaId: number): Promise<ActionState> {
  await requireAdmin();

  const item = await svc.getMediaById(mediaId);
  if (!item) return failure("That file no longer exists.");

  try {
    const { deleteStoredFile } = await import("@/lib/storage");
    // Vercel Blob deletes by URL; the local adapter deletes by relative path.
    await deleteStoredFile(
      item.provider === "blob" ? item.url : item.pathname,
      item.provider === "blob" ? "blob" : "local",
    );
  } catch (error) {
    // The database record is still removed — an orphaned blob is better than a
    // dangling row pointing at a file the admin thinks is gone.
    console.error("storage delete failed:", error);
  }

  await svc.deleteMediaRecord(mediaId);
  revalidatePath("/admin/media");

  return success("File deleted.");
}

/* -------------------------------------------------------------------------- */
/* Re-exported for the API layer                                               */
/* -------------------------------------------------------------------------- */

export async function revalidateEverything(): Promise<ActionState> {
  await requireAdmin();

  revalidateContent(Object.values(TAGS) as CacheTag[]);
  return success("All caches cleared.");
}
