"use client";

import { useActionState } from "react";

import { saveProfile } from "@/app/admin/actions";
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
import type { Profile } from "@/db/schema";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveProfile, IDLE);
  useActionToast(state);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <FormError state={state} />

      <FormCard className="space-y-6">
        <FormSection title="Identity" description="Shown in the hero and the browser tab.">
          <TextField
            name="fullName"
            label="Full name"
            required
            defaultValue={profile.fullName}
            error={errors.fullName}
          />
          <TextField
            name="headline"
            label="Professional headline"
            hint="One line under your name, e.g. “Software Engineer — Full-Stack & Data”."
            defaultValue={profile.headline}
            error={errors.headline}
          />
          <TextArea
            name="introduction"
            label="Hero introduction"
            rows={3}
            hint="Two or three sentences: who you are, what you build."
            defaultValue={profile.introduction}
            error={errors.introduction}
          />
          <FileField
            name="avatarUrl"
            label="Profile photo"
            folder="avatar"
            accept="image"
            defaultValue={profile.avatarUrl}
            hint="Square image works best. PNG, JPEG, WebP or AVIF, up to 5 MB."
            error={errors.avatarUrl}
          />
          <CheckboxField
            name="availableForWork"
            label="Show the “open to roles” badge"
            hint="Displays an availability pill at the top of the hero."
            defaultChecked={profile.availableForWork}
          />
        </FormSection>

        <FormSection title="About" description="The About section of the portfolio.">
          <TextArea
            name="summary"
            label="Professional summary"
            rows={6}
            hint="Blank lines separate paragraphs."
            defaultValue={profile.summary}
            error={errors.summary}
          />
          <TextArea
            name="careerInterests"
            label="Career interests"
            rows={3}
            defaultValue={profile.careerInterests}
            error={errors.careerInterests}
          />
          <TextArea
            name="technicalInterests"
            label="Technical interests"
            rows={3}
            defaultValue={profile.technicalInterests}
            error={errors.technicalInterests}
          />
          <TextArea
            name="currentFocus"
            label="Current focus"
            rows={3}
            hint="Also shown in the hero panel."
            defaultValue={profile.currentFocus}
            error={errors.currentFocus}
          />
        </FormSection>

        <FormSection title="Contact" description="Used by the contact section and structured data.">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="email"
              label="Email"
              type="email"
              defaultValue={profile.email}
              error={errors.email}
            />
            <TextField
              name="phone"
              label="Phone"
              hint="Optional. Not displayed publicly by default."
              defaultValue={profile.phone}
              error={errors.phone}
            />
          </div>
          <TextField
            name="location"
            label="Location"
            defaultValue={profile.location}
            error={errors.location}
          />
        </FormSection>
      </FormCard>

      <div className="flex items-center gap-3">
        <SubmitButton>Save profile</SubmitButton>
        <p className="text-fg-subtle text-[13px]">Saving updates the public site immediately.</p>
      </div>
    </form>
  );
}
