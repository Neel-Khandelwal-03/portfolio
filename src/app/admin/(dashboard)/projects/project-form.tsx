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
            defaultValue={project?.summary ?? ""}
            error={errors.summary}
          />

          <TextArea
            name="description"
            label="Full description"
            rows={10}
            hint="The project detail page. Blank lines separate paragraphs."
            defaultValue={project?.description ?? ""}
            error={errors.description}
          />
        </FormSection>

        <FormSection title="Classification">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1.5 block text-[13px] font-medium">
                Category<span className="ml-1 text-danger">*</span>
              </label>
              <input
                id="category"
                name="category"
                list="project-categories"
                required
                defaultValue={project?.category ?? "Full-Stack"}
                aria-invalid={Boolean(errors.category)}
                className="w-full rounded-lg border border-border-base bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none aria-[invalid=true]:border-danger"
              />
              <datalist id="project-categories">
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {errors.category ? (
                <p className="mt-1.5 text-[13px] text-danger">{errors.category}</p>
              ) : (
                <p className="mt-1.5 text-[13px] text-fg-subtle">
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
              defaultValue={project?.displayOrder ?? 0}
              error={errors.displayOrder}
            />
          </div>

          <TextArea
            name="technologies"
            label="Technologies"
            rows={3}
            hint="One per line, or comma separated."
            defaultValue={project?.technologies.join("\n") ?? ""}
            error={errors.technologies}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="startDate"
              label="Start date"
              type="date"
              defaultValue={project?.startDate ?? ""}
              error={errors.startDate}
            />
            <TextField
              name="endDate"
              label="End date"
              type="date"
              hint="Leave empty if it is ongoing."
              defaultValue={project?.endDate ?? ""}
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
            defaultValue={project?.githubUrl ?? ""}
            error={errors.githubUrl}
          />
          <TextField
            name="liveUrl"
            label="Live demo URL"
            type="url"
            placeholder="https://example.com"
            defaultValue={project?.liveUrl ?? ""}
            error={errors.liveUrl}
          />
        </FormSection>

        <FormSection title="Media">
          <FileField
            name="coverImageUrl"
            label="Cover image"
            folder="projects"
            accept="image"
            defaultValue={project?.coverImageUrl}
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
            defaultChecked={project?.isPublished ?? true}
          />
          <CheckboxField
            name="isFeatured"
            label="Featured"
            hint="Featured projects appear in the Projects section of the homepage."
            defaultChecked={project?.isFeatured ?? false}
          />
        </FormSection>
      </FormCard>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{project ? "Save project" : "Create project"}</SubmitButton>
        <Link
          href="/admin/projects"
          className="inline-flex h-10 items-center rounded-lg border border-border-base px-4 text-sm font-medium hover:bg-bg-subtle"
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
              className="flex items-center gap-3 rounded-lg border border-border-base bg-bg p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="h-12 w-16 shrink-0 rounded border border-border-base object-cover"
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
                className="min-w-0 flex-1 rounded-md border border-border-base bg-bg px-2.5 py-1.5 text-[13px] focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                aria-label={`Remove screenshot ${index + 1}`}
                className="shrink-0 rounded-md px-2 py-1 text-[13px] font-medium text-danger hover:bg-danger-soft"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border-base bg-bg px-3 text-[13px] font-medium hover:border-border-strong hover:bg-bg-subtle">
        {busy ? "Uploading…" : "Add screenshot"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={add}
          disabled={busy}
          className="sr-only"
        />
      </label>
      <p className="mt-1.5 text-[13px] text-fg-subtle">Up to 12 images, shown on the detail page.</p>
    </div>
  );
}
