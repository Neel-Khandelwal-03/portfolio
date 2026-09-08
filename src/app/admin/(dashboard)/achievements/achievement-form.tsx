"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createAchievement, updateAchievement } from "@/app/admin/actions";
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
import type { Achievement } from "@/db/schema";

export function AchievementForm({ achievement }: { achievement?: Achievement }) {
  const action = achievement ? updateAchievement : createAchievement;
  const [state, formAction] = useActionState<ActionState, FormData>(action, IDLE);
  useActionToast(state);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {achievement ? <input type="hidden" name="id" value={achievement.id} /> : null}

      <FormError state={state} />

      <FormCard className="space-y-6">
        <FormSection title="Achievement">
          <TextField
            name="title"
            label="Title"
            required
            defaultValue={achievement?.title ?? ""}
            error={errors.title}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="organization"
              label="Organisation"
              defaultValue={achievement?.organization ?? ""}
              error={errors.organization}
            />
            <TextField
              name="date"
              label="Date"
              type="date"
              defaultValue={achievement?.date ?? ""}
              error={errors.date}
            />
          </div>
          <TextArea
            name="description"
            label="Description"
            rows={4}
            defaultValue={achievement?.description ?? ""}
            error={errors.description}
          />
        </FormSection>

        <FormSection title="Evidence">
          <TextField
            name="url"
            label="Link"
            type="url"
            placeholder="https://…"
            hint="Leaderboard, article, repository — anything that backs it up."
            defaultValue={achievement?.url ?? ""}
            error={errors.url}
          />
          <FileField
            name="fileUrl"
            label="Document"
            folder="achievements"
            accept="document"
            preview={false}
            defaultValue={achievement?.fileUrl}
            hint="PDF certificate or letter."
            error={errors.fileUrl}
          />
          <TextField
            name="displayOrder"
            label="Display order"
            type="number"
            min={0}
            defaultValue={achievement?.displayOrder ?? 0}
            error={errors.displayOrder}
          />
        </FormSection>
      </FormCard>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{achievement ? "Save achievement" : "Create achievement"}</SubmitButton>
        <Link
          href="/admin/achievements"
          className="inline-flex h-10 items-center rounded-lg border border-border-base px-4 text-sm font-medium hover:bg-bg-subtle"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
