"use client";

import { useActionState, useTransition } from "react";

import { removeResume, saveResume } from "@/app/admin/actions";
import { FileField, FormCard, FormError, SubmitButton, useActionToast } from "@/components/admin/form";
import { useToast } from "@/components/admin/toast";
import { IDLE, type ActionState } from "@/lib/action-state";

export function ResumeForm({ currentUrl }: { currentUrl: string | null }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveResume, IDLE);
  const [removing, startRemove] = useTransition();
  const toast = useToast();
  useActionToast(state);

  function remove() {
    startRemove(async () => {
      const result = await removeResume(IDLE, new FormData());
      toast(result.message ?? "Resume removed.", result.status === "error" ? "error" : "success");
    });
  }

  return (
    <FormCard>
      <form action={formAction} className="space-y-5">
        <FormError state={state} />

        <FileField
          name="resumeUrl"
          label="Resume PDF"
          folder="resume"
          accept="document"
          preview={false}
          defaultValue={currentUrl}
          hint="PDF only, up to 10 MB. Upload the file, then press Save."
          error={state.fieldErrors?.resumeUrl}
        />

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton>Save resume</SubmitButton>
          {currentUrl ? (
            <button
              type="button"
              onClick={remove}
              disabled={removing}
              className="inline-flex h-10 items-center rounded-lg border border-border-base px-4 text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-60"
            >
              {removing ? "Removing" : "Remove resume"}
            </button>
          ) : null}
        </div>
      </form>
    </FormCard>
  );
}
