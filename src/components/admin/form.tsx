"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { useToast } from "@/components/admin/toast";
import { AlertIcon, SpinnerIcon, UploadIcon } from "@/components/ui/icons";
import type { ActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-lg border border-border-base bg-bg px-3 py-2 text-sm text-fg " +
  "placeholder:text-fg-subtle focus:border-accent focus:outline-none " +
  "disabled:opacity-60 aria-[invalid=true]:border-danger";

/* -------------------------------------------------------------------------- */
/* Field wrapper                                                               */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium">
        {label}
        {required ? (
          <span className="text-danger ml-1" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-danger mt-1.5 text-[13px]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-fg-subtle mt-1.5 text-[13px]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type BaseProps = {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

export function TextField({
  name,
  label,
  hint,
  error,
  required,
  className,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field
      label={label}
      htmlFor={name}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <input
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        required={required}
        className={CONTROL}
        {...props}
      />
    </Field>
  );
}

export function TextArea({
  name,
  label,
  hint,
  error,
  required,
  className,
  rows = 4,
  ...props
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field
      label={label}
      htmlFor={name}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <textarea
        id={name}
        name={name}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        required={required}
        className={cn(CONTROL, "resize-y leading-relaxed")}
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  hint,
  error,
  required,
  className,
  options,
  ...props
}: BaseProps &
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string | number; label: string }[];
  }) {
  return (
    <Field
      label={label}
      htmlFor={name}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <select
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={CONTROL}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  error,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  /** Rendered like every other field — a toggle must never fail invisibly. */
  error?: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className="border-border-strong mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--accent)]"
      />
      <div>
        <label htmlFor={name} className="text-[13px] font-medium">
          {label}
        </label>
        {error ? (
          <p id={`${name}-error`} className="text-danger mt-0.5 text-[13px]">
            {error}
          </p>
        ) : hint ? (
          <p className="text-fg-subtle mt-0.5 text-[13px]">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* File upload                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Uploads a file, then stores the resulting URL in a hidden input so the value
 * travels with the normal form submission.
 *
 * Upload happens immediately on selection against `/api/admin/upload`, which
 * re-validates type, magic bytes and size on the server.
 */
export function FileField({
  name,
  label,
  hint,
  error,
  folder,
  accept = "image",
  defaultValue,
  preview = true,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  folder: string;
  accept?: "image" | "document";
  defaultValue?: string | null;
  preview?: boolean;
}) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const toast = useToast();

  async function onSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setUploadError(null);

    try {
      const body = new FormData();
      body.set("file", file);
      body.set("folder", folder);
      body.set("accept", accept);

      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        setUploadError(payload.error ?? "Upload failed.");
        toast(payload.error ?? "Upload failed.", "error");
        return;
      }

      setValue(payload.url);
      toast("File uploaded.");
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
      toast("Upload failed.", "error");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  const accepted =
    accept === "image" ? "image/png,image/jpeg,image/webp,image/avif" : "application/pdf";

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>

      <input type="hidden" name={name} value={value} />

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={inputId}
          className="border-border-base bg-bg text-fg hover:border-border-strong hover:bg-bg-subtle inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[13px] font-medium"
        >
          {busy ? (
            <SpinnerIcon width={14} height={14} className="animate-spin" />
          ) : (
            <UploadIcon width={14} height={14} />
          )}
          {busy ? "Uploading" : value ? "Replace" : "Upload"}
        </label>
        <input
          id={inputId}
          type="file"
          accept={accepted}
          disabled={busy}
          onChange={onSelect}
          className="sr-only"
        />

        {value ? (
          <>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent max-w-[220px] truncate text-[13px] hover:underline"
            >
              {value.split("/").pop()}
            </a>
            <button
              type="button"
              onClick={() => setValue("")}
              className="text-danger text-[13px] font-medium hover:underline"
            >
              Remove
            </button>
          </>
        ) : null}
      </div>

      {preview && value && accept === "image" ? (
        // A plain <img> rather than next/image: the value changes at runtime and
        // may point at any configured store, so there is nothing to optimise
        // ahead of time and this is admin-only UI.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="border-border-base mt-3 h-24 w-auto rounded-lg border object-contain"
        />
      ) : null}

      {uploadError || error ? (
        <p className="text-danger mt-1.5 text-[13px]">{uploadError ?? error}</p>
      ) : hint ? (
        <p className="text-fg-subtle mt-1.5 text-[13px]">{hint}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Form chrome                                                                 */
/* -------------------------------------------------------------------------- */

export function FormError({ state }: { state: ActionState }) {
  if (state.status !== "error" || !state.message) return null;

  return (
    <div
      role="alert"
      className="border-border-base bg-danger-soft flex items-start gap-2.5 rounded-lg border p-3.5 text-sm"
    >
      <AlertIcon width={16} height={16} className="text-danger mt-0.5 shrink-0" />
      <div>
        <p>{state.message}</p>
        {state.fieldErrors?._form ? (
          <p className="text-fg-muted mt-1 text-[13px]">{state.fieldErrors._form}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SubmitButton({
  children = "Save",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "bg-accent text-accent-fg hover:bg-accent-hover inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-150 disabled:opacity-60",
        className,
      )}
    >
      {pending ? (
        <>
          <SpinnerIcon width={15} height={15} className="animate-spin" />
          Saving
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Raises a toast whenever an action reports success. */
export function useActionToast(state: ActionState) {
  const toast = useToast();

  useEffect(() => {
    if (!state.message) return;

    // A failure is always announced, even when the form also renders the error
    // inline. Suppressing the toast whenever `fieldErrors` was present used to
    // make a rejected submission completely invisible in the compact inline
    // forms, which have no room for an error summary — pressing Save simply
    // appeared to do nothing.
    if (state.status === "success") toast(state.message, "success");
    else if (state.status === "error") toast(state.message, "error");
    // `key` changes on every action response, so repeat saves still notify.
  }, [state.key, state.status, state.message, toast]);
}

export function FormCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("border-border-base bg-bg-raised rounded-xl border p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-border-base border-t pt-6 first:border-0 first:pt-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? <p className="text-fg-subtle mt-1 text-[13px]">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
