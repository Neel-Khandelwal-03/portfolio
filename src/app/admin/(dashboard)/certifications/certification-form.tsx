"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createCertification, updateCertification } from "@/app/admin/actions";
import {
  FileField,
  FormCard,
  FormError,
  FormSection,
  SubmitButton,
  TextField,
  useActionToast,
} from "@/components/admin/form";
import { IDLE, type ActionState } from "@/lib/action-state";
import type { Certification } from "@/db/schema";

export function CertificationForm({ certification }: { certification?: Certification }) {
  const action = certification ? updateCertification : createCertification;
  const [state, formAction] = useActionState<ActionState, FormData>(action, IDLE);
  useActionToast(state);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {certification ? <input type="hidden" name="id" value={certification.id} /> : null}

      <FormError state={state} />

      <FormCard className="space-y-6">
        <FormSection title="Certification">
          <TextField
            name="name"
            label="Certification name"
            required
            defaultValue={certification?.name ?? ""}
            error={errors.name}
          />
          <TextField
            name="issuer"
            label="Issuing organisation"
            required
            defaultValue={certification?.issuer ?? ""}
            error={errors.issuer}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="issueDate"
              label="Issue date"
              type="date"
              defaultValue={certification?.issueDate ?? ""}
              error={errors.issueDate}
            />
            <TextField
              name="expiryDate"
              label="Expiry date"
              type="date"
              hint="Leave empty if it does not expire."
              defaultValue={certification?.expiryDate ?? ""}
              error={errors.expiryDate}
            />
          </div>
        </FormSection>

        <FormSection title="Credential">
          <TextField
            name="credentialId"
            label="Credential ID"
            defaultValue={certification?.credentialId ?? ""}
            error={errors.credentialId}
          />
          <TextField
            name="credentialUrl"
            label="Verification URL"
            type="url"
            placeholder="https://…"
            hint="Shown as a “Verify” link."
            defaultValue={certification?.credentialUrl ?? ""}
            error={errors.credentialUrl}
          />
          <FileField
            name="fileUrl"
            label="Certificate file"
            folder="certificates"
            accept="document"
            preview={false}
            defaultValue={certification?.fileUrl}
            hint="PDF, up to 10 MB."
            error={errors.fileUrl}
          />
          <TextField
            name="displayOrder"
            label="Display order"
            type="number"
            min={0}
            defaultValue={certification?.displayOrder ?? 0}
            error={errors.displayOrder}
          />
        </FormSection>
      </FormCard>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{certification ? "Save certification" : "Create certification"}</SubmitButton>
        <Link
          href="/admin/certifications"
          className="border-border-base hover:bg-bg-subtle inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
