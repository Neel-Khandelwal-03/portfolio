"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createEducation, updateEducation } from "@/app/admin/actions";
import {
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
import type { Education } from "@/db/schema";

export function EducationForm({ education }: { education?: Education }) {
  const action = education ? updateEducation : createEducation;
  const [state, formAction] = useActionState<ActionState, FormData>(action, IDLE);
  useActionToast(state);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {education ? <input type="hidden" name="id" value={education.id} /> : null}

      <FormError state={state} />

      <FormCard className="space-y-6">
        <FormSection title="Institution">
          <TextField
            name="institution"
            label="Institution"
            required
            defaultValue={education?.institution ?? ""}
            error={errors.institution}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="degree"
              label="Degree"
              required
              placeholder="B.Tech"
              defaultValue={education?.degree ?? ""}
              error={errors.degree}
            />
            <TextField
              name="field"
              label="Field of study"
              placeholder="Computer Science and Engineering"
              defaultValue={education?.field ?? ""}
              error={errors.field}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="location"
              label="Location"
              defaultValue={education?.location ?? ""}
              error={errors.location}
            />
            <TextField
              name="grade"
              label="CGPA / percentage"
              placeholder="8.7 / 10"
              defaultValue={education?.grade ?? ""}
              error={errors.grade}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="startDate"
              label="Start date"
              type="date"
              defaultValue={education?.startDate ?? ""}
              error={errors.startDate}
            />
            <TextField
              name="endDate"
              label="End date"
              type="date"
              hint="Leave empty if you are still studying."
              defaultValue={education?.endDate ?? ""}
              error={errors.endDate}
            />
          </div>
        </FormSection>

        <FormSection title="Details">
          <TextArea
            name="description"
            label="Description"
            rows={4}
            hint="Relevant coursework, specialisation, anything worth calling out."
            defaultValue={education?.description ?? ""}
            error={errors.description}
          />
          <TextArea
            name="achievements"
            label="Achievements"
            rows={4}
            hint="One per line."
            defaultValue={education?.achievements.join("\n") ?? ""}
            error={errors.achievements}
          />
          <FileField
            name="logoUrl"
            label="Institution logo"
            folder="logos"
            accept="image"
            defaultValue={education?.logoUrl}
            error={errors.logoUrl}
          />
          <TextField
            name="displayOrder"
            label="Display order"
            type="number"
            min={0}
            defaultValue={education?.displayOrder ?? 0}
            error={errors.displayOrder}
          />
        </FormSection>
      </FormCard>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{education ? "Save entry" : "Create entry"}</SubmitButton>
        <Link
          href="/admin/education"
          className="border-border-base hover:bg-bg-subtle inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
