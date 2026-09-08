"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createExperience, updateExperience } from "@/app/admin/actions";
import {
  CheckboxField,
  FileField,
  FormCard,
  FormError,
  FormSection,
  SelectField,
  SubmitButton,
  TextArea,
  TextField,
  useActionToast,
} from "@/components/admin/form";
import { IDLE, type ActionState } from "@/lib/action-state";
import type { Experience } from "@/db/schema";

const EMPLOYMENT_TYPES = [
  "Internship",
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Apprenticeship",
  "Volunteer",
].map((value) => ({ value, label: value }));

export function ExperienceForm({ experience }: { experience?: Experience }) {
  const action = experience ? updateExperience : createExperience;
  const [state, formAction] = useActionState<ActionState, FormData>(action, IDLE);
  useActionToast(state);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {experience ? <input type="hidden" name="id" value={experience.id} /> : null}

      <FormError state={state} />

      <FormCard className="space-y-6">
        <FormSection title="Role">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="company"
              label="Company"
              required
              defaultValue={experience?.company ?? ""}
              error={errors.company}
            />
            <TextField
              name="role"
              label="Role"
              required
              defaultValue={experience?.role ?? ""}
              error={errors.role}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              name="employmentType"
              label="Employment type"
              options={EMPLOYMENT_TYPES}
              defaultValue={experience?.employmentType ?? "Internship"}
              error={errors.employmentType}
            />
            <TextField
              name="location"
              label="Location"
              placeholder="Remote / Bengaluru, India"
              defaultValue={experience?.location ?? ""}
              error={errors.location}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="startDate"
              label="Start date"
              type="date"
              required
              defaultValue={experience?.startDate ?? ""}
              error={errors.startDate}
            />
            <TextField
              name="endDate"
              label="End date"
              type="date"
              hint="Leave empty for a current role — the timeline shows “Present”."
              defaultValue={experience?.endDate ?? ""}
              error={errors.endDate}
            />
          </div>
        </FormSection>

        <FormSection title="What you did">
          <TextArea
            name="description"
            label="Description"
            rows={4}
            hint="A short paragraph about the role and the team."
            defaultValue={experience?.description ?? ""}
            error={errors.description}
          />
          <TextArea
            name="responsibilities"
            label="Responsibilities"
            rows={5}
            hint="One bullet per line."
            defaultValue={experience?.responsibilities.join("\n") ?? ""}
            error={errors.responsibilities}
          />
          <TextArea
            name="achievements"
            label="Achievements"
            rows={4}
            hint="One per line. Quantify where you can."
            defaultValue={experience?.achievements.join("\n") ?? ""}
            error={errors.achievements}
          />
          <TextArea
            name="technologies"
            label="Technologies"
            rows={3}
            hint="One per line, or comma separated."
            defaultValue={experience?.technologies.join("\n") ?? ""}
            error={errors.technologies}
          />
        </FormSection>

        <FormSection title="Files">
          <FileField
            name="logoUrl"
            label="Company logo"
            folder="logos"
            accept="image"
            defaultValue={experience?.logoUrl}
            hint="Small square or wordmark. Shown next to the company name."
            error={errors.logoUrl}
          />
          <FileField
            name="certificateUrl"
            label="Certificate / offer letter"
            folder="certificates"
            accept="document"
            preview={false}
            defaultValue={experience?.certificateUrl}
            hint="PDF. A “View certificate” link appears on the timeline."
            error={errors.certificateUrl}
          />
        </FormSection>

        <FormSection title="Display">
          <TextField
            name="displayOrder"
            label="Display order"
            type="number"
            min={0}
            defaultValue={experience?.displayOrder ?? 0}
            error={errors.displayOrder}
          />
          <CheckboxField
            name="isPublished"
            label="Published"
            defaultChecked={experience?.isPublished ?? true}
          />
        </FormSection>
      </FormCard>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{experience ? "Save experience" : "Create experience"}</SubmitButton>
        <Link
          href="/admin/experience"
          className="inline-flex h-10 items-center rounded-lg border border-border-base px-4 text-sm font-medium hover:bg-bg-subtle"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
