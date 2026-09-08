"use client";

import { useState } from "react";

import { Button } from "@/components/ui";
import { AlertIcon, CheckIcon, SpinnerIcon } from "@/components/ui/icons";
import { track } from "@/lib/analytics";

type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;
type Status = "idle" | "submitting" | "success" | "error";

const FIELD_STYLES =
  "w-full rounded-lg border border-border-base bg-bg-raised px-3 py-2.5 text-sm text-fg " +
  "placeholder:text-fg-subtle focus:border-accent focus:outline-none " +
  "aria-[invalid=true]:border-danger";

export function ContactForm({ recipient }: { recipient: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    setStatus("submitting");
    setErrors({});
    setFormError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        fieldErrors?: FieldErrors;
      };

      if (!response.ok) {
        setErrors(payload.fieldErrors ?? {});
        setFormError(payload.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("success");
      track("contact_submit");
    } catch {
      setFormError("Could not reach the server. Please email me directly instead.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="border-border-base bg-success-soft flex items-start gap-3 rounded-xl border p-5"
      >
        <CheckIcon width={18} height={18} className="text-success mt-0.5 shrink-0" />
        <div>
          <p className="text-fg text-sm font-semibold">Message sent</p>
          <p className="text-fg-muted mt-1 text-sm">
            Thanks for reaching out — I will reply to you shortly.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => setStatus("idle")}>
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  const busy = status === "submitting";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError ? (
        <div
          role="alert"
          className="border-border-base bg-danger-soft text-fg flex items-start gap-2.5 rounded-lg border p-3.5 text-sm"
        >
          <AlertIcon width={16} height={16} className="text-danger mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-[13px] font-medium">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            maxLength={160}
            disabled={busy}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={FIELD_STYLES}
            placeholder="Your name"
          />
          {errors.name ? (
            <p id="contact-name-error" className="text-danger mt-1.5 text-[13px]">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-[13px] font-medium">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            disabled={busy}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={FIELD_STYLES}
            placeholder="you@example.com"
          />
          {errors.email ? (
            <p id="contact-email-error" className="text-danger mt-1.5 text-[13px]">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-[13px] font-medium">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={5000}
          disabled={busy}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={`${FIELD_STYLES} resize-y`}
          placeholder="What would you like to talk about?"
        />
        {errors.message ? (
          <p id="contact-message-error" className="text-danger mt-1.5 text-[13px]">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot: hidden from people and from screen readers, irresistible to
          naive bots. A filled value is rejected server-side. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Button type="submit" disabled={busy} size="lg">
          {busy ? (
            <>
              <SpinnerIcon width={15} height={15} className="animate-spin" />
              Sending
            </>
          ) : (
            "Send message"
          )}
        </Button>
        <p className="text-fg-subtle text-[13px]">
          Or email me at{" "}
          <a href={`mailto:${recipient}`} className="text-accent font-medium hover:underline">
            {recipient}
          </a>
        </p>
      </div>
    </form>
  );
}
