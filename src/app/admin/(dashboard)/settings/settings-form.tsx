"use client";

import { useActionState } from "react";

import { saveSiteSettings } from "@/app/admin/actions";
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
import type { SiteSettings } from "@/db/schema";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveSiteSettings, IDLE);
  useActionToast(state);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <FormError state={state} />

      <FormCard className="space-y-6">
        <FormSection
          title="SEO"
          description="Used for the page title, meta description and social preview."
        >
          <TextField
            name="siteTitle"
            label="Site title"
            hint="Appears in the browser tab and search results."
            defaultValue={settings.siteTitle}
            error={errors.siteTitle}
          />
          <TextArea
            name="siteDescription"
            label="Meta description"
            rows={3}
            hint="Aim for 150-160 characters."
            defaultValue={settings.siteDescription}
            error={errors.siteDescription}
          />
          <TextArea
            name="seoKeywords"
            label="Keywords"
            rows={3}
            hint="One per line, or comma separated."
            defaultValue={settings.seoKeywords.join("\n")}
            error={errors.seoKeywords}
          />
          <FileField
            name="ogImageUrl"
            label="Social preview image"
            folder="og"
            accept="image"
            defaultValue={settings.ogImageUrl}
            hint="1200x630 works best. Leave empty to use the generated card."
            error={errors.ogImageUrl}
          />
        </FormSection>

        <FormSection title="Footer">
          <TextField
            name="footerText"
            label="Footer text"
            defaultValue={settings.footerText}
            error={errors.footerText}
          />
        </FormSection>

        <FormSection title="Features">
          <CheckboxField
            name="contactFormEnabled"
            label="Enable the contact form"
            hint="When off, the contact section shows your links only."
            defaultChecked={settings.contactFormEnabled}
          />
          <CheckboxField
            name="analyticsEnabled"
            label="Enable first-party analytics"
            hint="Counts resume downloads and outbound link clicks. No cookies, no third party."
            defaultChecked={settings.analyticsEnabled}
          />
        </FormSection>
      </FormCard>

      <SubmitButton>Save settings</SubmitButton>
    </form>
  );
}
