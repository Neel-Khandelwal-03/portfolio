import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Reusable primitives                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Trims, then treats "" as absent so empty form fields become null.
 *
 * `.nullish()` also covers a key that is missing entirely, which happens for
 * API clients that simply omit an optional field.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v == null || v === "" ? null : v));

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .nullish()
  .transform((v) => {
    if (v == null || v === "") return null;
    // People type "github.com/me/repo". Rejecting that is pedantic when the
    // intent is unambiguous, so add the scheme rather than fail the whole save.
    if (/^(https?:\/\/|mailto:|\/)/i.test(v)) return v;
    if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) return `https://${v}`;
    return v;
  })
  .refine(
    (v) => v === null || /^https?:\/\/.+/i.test(v) || v.startsWith("/") || /^mailto:/i.test(v),
    { message: "Must be an http(s) URL, a mailto: link, or a site-relative path" },
  );

/** `YYYY-MM-DD`, or null when the field is blank or absent. */
const optionalDate = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v == null || v === "" ? null : v))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: "Use the date picker (YYYY-MM-DD)",
  });

const requiredDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "A start date is required");

/**
 * Multi-value fields arrive from textareas as newline- or comma-separated text.
 * Accepting both keeps the forms forgiving without needing a tag-input widget.
 */
const stringList = z
  .union([z.string(), z.array(z.string())])
  .nullish()
  .transform((value) => {
    if (value == null) return [];
    const parts = Array.isArray(value) ? value : value.split(/[\n,]/);
    return parts.map((p) => p.trim()).filter(Boolean);
  })
  .pipe(z.array(z.string().max(120)).max(60));

/** Newline-separated only — commas are legitimate inside a bullet point. */
const bulletList = z
  .union([z.string(), z.array(z.string())])
  .nullish()
  .transform((value) => {
    if (value == null) return [];
    const parts = Array.isArray(value) ? value : value.split(/\n/);
    return parts.map((p) => p.trim().replace(/^[-•*]\s*/, "")).filter(Boolean);
  })
  .pipe(z.array(z.string().max(500)).max(40));

const displayOrder = z.coerce.number().int().min(0).max(9999).default(0);

/**
 * A checkbox.
 *
 * An unticked checkbox is not submitted at all, so the key is simply absent
 * from the form data — `.optional()` is what makes that valid. Listing
 * `z.undefined()` inside the union is not enough: Zod still treats the property
 * as required and rejects a missing key, which made every toggle in the admin
 * impossible to turn off.
 */
const checkbox = z
  .union([z.boolean(), z.string(), z.null()])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true");

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(220)
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens only");

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(200),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(12, "Use at least 12 characters")
      .max(200)
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/* -------------------------------------------------------------------------- */
/* Profile & settings                                                          */
/* -------------------------------------------------------------------------- */

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(160),
  headline: z.string().trim().max(240).default(""),
  introduction: z.string().trim().max(1200).default(""),
  summary: z.string().trim().max(4000).default(""),
  careerInterests: z.string().trim().max(2000).default(""),
  technicalInterests: z.string().trim().max(2000).default(""),
  currentFocus: z.string().trim().max(2000).default(""),
  email: z.union([z.literal(""), z.string().email("Enter a valid email address")]).default(""),
  phone: z.string().trim().max(40).default(""),
  location: z.string().trim().max(160).default(""),
  avatarUrl: optionalUrl,
  availableForWork: checkbox,
});

export const resumeSchema = z.object({
  resumeUrl: z.string().trim().min(1, "Upload a resume file first").max(2048),
});

export const siteSettingsSchema = z.object({
  siteTitle: z.string().trim().max(200).default(""),
  siteDescription: z.string().trim().max(400).default(""),
  seoKeywords: stringList,
  ogImageUrl: optionalUrl,
  footerText: z.string().trim().max(300).default(""),
  contactFormEnabled: checkbox,
  analyticsEnabled: checkbox,
});

/* -------------------------------------------------------------------------- */
/* Skills                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The category form derives its slug in the browser as the name is typed and
 * submits it in a hidden field. Deriving it again here means a paste, a browser
 * autofill, or a submit that lands before React re-rendered still produces a
 * valid slug instead of failing on a field the user cannot even see.
 */
export const skillCategorySchema = z
  .object({
    name: z.string().trim().min(1, "Category name is required").max(120),
    slug: z.string().trim().max(140).optional(),
    displayOrder,
  })
  .transform((data) => ({ ...data, slug: data.slug || slugify(data.name) }))
  .refine((data) => SLUG_PATTERN.test(data.slug), {
    message: "Use a name with letters or numbers in it",
    path: ["name"],
  });

export const skillSchema = z.object({
  categoryId: z.coerce.number().int().positive("Choose a category"),
  name: z.string().trim().min(1, "Skill name is required").max(120),
  // The inline skill editor has no proficiency input at all, so the key is
  // absent there — it must be treated the same as an empty one.
  proficiency: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(5)])
    .nullish()
    .transform((v) => (v == null || v === "" ? null : v)),
  isVisible: checkbox,
  displayOrder,
});

/* -------------------------------------------------------------------------- */
/* Projects                                                                    */
/* -------------------------------------------------------------------------- */

export const screenshotSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  caption: z.string().trim().max(200).optional(),
});

export const projectSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    slug: z.string().trim().max(220).optional(),
    summary: z.string().trim().max(400).default(""),
    description: z.string().trim().max(20000).default(""),
    category: z.string().trim().min(1, "Category is required").max(80).default("Web"),
    technologies: stringList,
    githubUrl: optionalUrl,
    liveUrl: optionalUrl,
    coverImageUrl: optionalUrl,
    screenshots: z
      .union([z.string(), z.array(screenshotSchema)])
      .transform((value) => {
        if (Array.isArray(value)) return value;
        if (!value.trim()) return [];
        try {
          const parsed: unknown = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })
      .pipe(z.array(screenshotSchema).max(12)),
    isFeatured: checkbox,
    isPublished: checkbox,
    startDate: optionalDate,
    endDate: optionalDate,
    displayOrder,
  })
  // The form fills the slug from the title as you type; derive it again here so
  // a blank field still yields a usable public URL rather than a hard error.
  .transform((data) => ({ ...data, slug: data.slug || slugify(data.title) }))
  .refine((data) => SLUG_PATTERN.test(data.slug), {
    message: "Use lowercase letters, numbers and hyphens only",
    path: ["slug"],
  });

/* -------------------------------------------------------------------------- */
/* Experience                                                                  */
/* -------------------------------------------------------------------------- */

export const experienceSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required").max(200),
    role: z.string().trim().min(1, "Role is required").max(200),
    employmentType: z.string().trim().min(1).max(60).default("Internship"),
    location: z.string().trim().max(160).default(""),
    startDate: requiredDate,
    endDate: optionalDate,
    description: z.string().trim().max(6000).default(""),
    responsibilities: bulletList,
    achievements: bulletList,
    technologies: stringList,
    logoUrl: optionalUrl,
    certificateUrl: optionalUrl,
    isPublished: checkbox,
    displayOrder,
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: "End date cannot be before the start date",
    path: ["endDate"],
  });

/* -------------------------------------------------------------------------- */
/* Education                                                                   */
/* -------------------------------------------------------------------------- */

export const educationSchema = z
  .object({
    institution: z.string().trim().min(1, "Institution is required").max(200),
    degree: z.string().trim().min(1, "Degree is required").max(200),
    field: z.string().trim().max(200).default(""),
    location: z.string().trim().max(160).default(""),
    startDate: optionalDate,
    endDate: optionalDate,
    grade: z.string().trim().max(80).default(""),
    description: z.string().trim().max(4000).default(""),
    achievements: bulletList,
    logoUrl: optionalUrl,
    displayOrder,
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: "End date cannot be before the start date",
    path: ["endDate"],
  });

/* -------------------------------------------------------------------------- */
/* Certifications                                                              */
/* -------------------------------------------------------------------------- */

export const certificationSchema = z.object({
  name: z.string().trim().min(1, "Certification name is required").max(240),
  issuer: z.string().trim().min(1, "Issuer is required").max(200),
  issueDate: optionalDate,
  expiryDate: optionalDate,
  credentialId: optionalText(200),
  credentialUrl: optionalUrl,
  fileUrl: optionalUrl,
  displayOrder,
});

/* -------------------------------------------------------------------------- */
/* Achievements                                                                */
/* -------------------------------------------------------------------------- */

export const achievementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(240),
  description: z.string().trim().max(4000).default(""),
  organization: z.string().trim().max(200).default(""),
  date: optionalDate,
  url: optionalUrl,
  fileUrl: optionalUrl,
  displayOrder,
});

/* -------------------------------------------------------------------------- */
/* Social links                                                                */
/* -------------------------------------------------------------------------- */

export const SOCIAL_PLATFORMS = [
  "github",
  "linkedin",
  "email",
  "x",
  "leetcode",
  "kaggle",
  "website",
] as const;

export const socialLinkSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(80),
  platform: z.enum(SOCIAL_PLATFORMS).default("website"),
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048)
    .refine((v) => /^https?:\/\/.+/i.test(v) || /^mailto:/i.test(v), {
      message: "Must be an http(s) URL or a mailto: link",
    }),
  isVisible: checkbox,
  displayOrder,
});

/* -------------------------------------------------------------------------- */
/* Contact form                                                                */
/* -------------------------------------------------------------------------- */

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(160),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(255),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(5000, "Message is too long"),
  /** Honeypot: bots fill hidden fields, humans never see this one. */
  website: z.string().max(0, "Rejected").optional().or(z.literal("")),
});

/* -------------------------------------------------------------------------- */
/* Reordering                                                                  */
/* -------------------------------------------------------------------------- */

export const reorderSchema = z.object({
  id: z.coerce.number().int().positive(),
  direction: z.enum(["up", "down"]),
});

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type ProfileInput = z.infer<typeof profileSchema>;
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type SkillCategoryInput = z.infer<typeof skillCategorySchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type AchievementInput = z.infer<typeof achievementSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
