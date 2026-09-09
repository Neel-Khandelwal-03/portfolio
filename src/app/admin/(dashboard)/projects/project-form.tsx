"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createProject, updateProject } from "@/app/admin/actions";
import {
  CheckboxField,
  FileField,
  FormCard,
  FormError,
  FormSection,
  SubmitButton,
  TextArea,
  TextField,
  useActionToast,
} from "@/components/admin/form";
import { IDLE, type ActionState } from "@/lib/action-state";
import { slugify } from "@/lib/validation";
import type { Project } from "@/db/schema";

const CATEGORIES = [
  "Full-Stack",
  "Frontend",
  "Backend",
  "Data / ML",
  "Systems",
  "Mobile",
  "Tooling",
  "Other",
];

export function ProjectForm({ project }: { project?: Project }) {
  const action = project ? updateProject : createProject;
  const [state, formAction] = useActionState<ActionState, FormData>(action, IDLE);
  useActionToast(state);

  // After a rejected save React clears the uncontrolled inputs, so fall back to
  // the values the action echoed back rather than to the stored record.
  const prior = state.values;
  const keep = (field: string, stored: string | null | undefined) => prior?.[field] ?? stored ?? "";

  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  // Once a project is live its slug is a public URL, so only auto-fill the slug
  // while creating — never silently rewrite an existing one.
  const [slugTouched, setSlugTouched] = useState(Boolean(project));

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      <FormError state={state} />

      <FormCard className="space-y-6">
        <FormSection title="Basics">
          <TextField
            name="title"
            label="Project name"
            required
            value={title}
            onChange={(event) => {
              const next = event.target.value;
              setTitle(next);
              if (!slugTouched) setSlug(slugify(next));
            }}
            error={errors.title}
          />

          <TextField
            name="slug"
            label="Slug"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            hint={`Public URL: /projects/${slug || "your-slug"}`}
            error={errors.slug}
          />

          <TextArea
            name="summary"
            label="Short description"
            rows={2}
            hint="One or two sentences. Shown on project cards and used for SEO."
            defaultValue={keep("summary", project?.summary)}
            error={errors.summary}
          />

          <TextArea
            name="description"
            label="Full description"
            rows={10}
            hint="The project detail page. Blank lines separate paragraphs."
            defaultValue={keep("description", project?.description)}
            error={errors.description}
          />
        </FormSection>

        <FormSection title="Classification">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1.5 block text-[13px] font-medium">
                Category<span className="text-danger ml-1">*</span>
              </label>
              <input
                id="category"
                name="category"
                list="project-categories"
                required
                defaultValue={prior?.category ?? project?.category ?? "Full-Stack"}
                aria-invalid={Boolean(errors.category)}
                className="border-border-base bg-bg focus:border-accent aria-[invalid=true]:border-danger w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              />
              <datalist id="project-categories">
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {errors.category ? (
                <p className="text-danger mt-1.5 text-[13px]">{errors.category}</p>
              ) : (
                <p className="text-fg-subtle mt-1.5 text-[13px]">
                  Pick from the list or type your own.
                </p>
              )}
            </div>

            <TextField
              name="displayOrder"
              label="Display order"
              type="number"
              min={0}
              hint="Lower numbers appear first. Reorder buttons on the list page also set this."
              defaultValue={prior?.displayOrder ?? project?.displayOrder ?? 0}
              error={errors.displayOrder}
            />
          </div>

          <TextArea
            name="technologies"
            label="Technologies"
            rows={3}
            hint="One per line, or comma separated."
            defaultValue={prior?.technologies ?? project?.technologies.join("\n") ?? ""}
            error={errors.technologies}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="startDate"
              label="Start date"
              type="date"
              defaultValue={keep("startDate", project?.startDate)}
              error={errors.startDate}
            />
            <TextField
              name="endDate"
              label="End date"
              type="date"
              hint="Leave empty if it is ongoing."
              defaultValue={keep("endDate", project?.endDate)}
              error={errors.endDate}
            />
          </div>
        </FormSection>

        <FormSection title="Links">
          <TextField
            name="githubUrl"
            label="GitHub URL"
            type="url"
            placeholder="https://github.com/you/project"
            defaultValue={keep("githubUrl", project?.githubUrl)}
            error={errors.githubUrl}
          />
          <TextField
            name="liveUrl"
            label="Live demo URL"
            type="url"
            placeholder="https://example.com"
            defaultValue={keep("liveUrl", project?.liveUrl)}
            error={errors.liveUrl}
          />
        </FormSection>

        <FormSection title="Media">
          <FileField
            name="coverImageUrl"
            label="Cover image"
            folder="projects"
            accept="image"
            defaultValue={prior?.coverImageUrl ?? project?.coverImageUrl}
            hint="16:9 works best. PNG, JPEG, WebP or AVIF, up to 5 MB."
            error={errors.coverImageUrl}
          />
          <ScreenshotsField defaultValue={project?.screenshots ?? []} />
        </FormSection>

        <FormSection title="Visibility">
          <CheckboxField
            name="isPublished"
            label="Published"
            hint="Unpublished projects are hidden from the public site entirely."
            error={errors.isPublished}
            defaultChecked={prior ? prior.isPublished === "on" : (project?.isPublished ?? true)}
          />
          <CheckboxField
            name="isFeatured"
            label="Featured"
            hint="Featured projects appear in the Projects section of the homepage."
            error={errors.isFeatured}
            defaultChecked={prior ? prior.isFeatured === "on" : (project?.isFeatured ?? false)}
          />
        </FormSection>
      </FormCard>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{project ? "Save project" : "Create project"}</SubmitButton>
        <Link
          href="/admin/projects"
          className="border-border-base hover:bg-bg-subtle inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Screenshots                                                                 */
/* -------------------------------------------------------------------------- */

type Screenshot = { url: string; caption?: string };

/**
 * A repeatable list of screenshots serialised into one hidden JSON field, so
 * the whole set travels with the normal form submission and is validated by the
 * same Zod schema on the server.
 */
function ScreenshotsField({ defaultValue }: { defaultValue: Screenshot[] }) {
  const [items, setItems] = useState<Screenshot[]>(defaultValue);
  const [busy, setBusy] = useState(false);

  async function add(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("folder", "screenshots");
      body.set("accept", "image");

      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const payload = (await response.json()) as { url?: string };
      if (payload.url) setItems((current) => [...current, { url: payload.url!, caption: "" }]);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium">Screenshots</span>
      <input type="hidden" name="screenshots" value={JSON.stringify(items)} />

      {items.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item.url}-${index}`}
              className="border-border-base bg-bg flex items-center gap-3 rounded-lg border p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="border-border-base h-12 w-16 shrink-0 rounded border object-cover"
              />
              <input
                type="text"
                value={item.caption ?? ""}
                placeholder="Caption (optional)"
                aria-label={`Caption for screenshot ${index + 1}`}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((entry, i) =>
                      i === index ? { ...entry, caption: event.target.value } : entry,
                    ),
                  )
                }
                className="border-border-base bg-bg focus:border-accent min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-[13px] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                aria-label={`Remove screenshot ${index + 1}`}
                className="text-danger hover:bg-danger-soft shrink-0 rounded-md px-2 py-1 text-[13px] font-medium"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="border-border-base bg-bg hover:border-border-strong hover:bg-bg-subtle inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[13px] font-medium">
        {busy ? "Uploading…" : "Add screenshot"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={add}
          disabled={busy}
          className="sr-only"
        />
      </label>
      <p className="text-fg-subtle mt-1.5 text-[13px]">
        Up to 12 images, shown on the detail page.
      </p>
    </div>
  );
}
