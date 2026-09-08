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
          <span className="ml-1 text-danger" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-[13px] text-fg-subtle">
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
    <Field label={label} htmlFor={name} hint={hint} error={error} required={required} className={className}>
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
    <Field label={label} htmlFor={name} hint={hint} error={error} required={required} className={className}>
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
    <Field label={label} htmlFor={name} hint={hint} error={error} required={required} className={className}>
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
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong accent-[var(--accent)]"
      />
      <div>
        <label htmlFor={name} className="text-[13px] font-medium">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-[13px] text-fg-subtle">{hint}</p> : null}
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
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border-base bg-bg px-3 text-[13px] font-medium text-fg hover:border-border-strong hover:bg-bg-subtle"
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
              className="max-w-[220px] truncate text-[13px] text-accent hover:underline"
            >
              {value.split("/").pop()}
            </a>
            <button
              type="button"
              onClick={() => setValue("")}
              className="text-[13px] font-medium text-danger hover:underline"
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
          className="mt-3 h-24 w-auto rounded-lg border border-border-base object-contain"
        />
      ) : null}

      {uploadError || error ? (
        <p className="mt-1.5 text-[13px] text-danger">{uploadError ?? error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-fg-subtle">{hint}</p>
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
      className="flex items-start gap-2.5 rounded-lg border border-border-base bg-danger-soft p-3.5 text-sm"
    >
      <AlertIcon width={16} height={16} className="mt-0.5 shrink-0 text-danger" />
      <div>
        <p>{state.message}</p>
        {state.fieldErrors?._form ? (
          <p className="mt-1 text-[13px] text-fg-muted">{state.fieldErrors._form}</p>
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
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors duration-150 hover:bg-accent-hover disabled:opacity-60",
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
    if (state.status === "success" && state.message) toast(state.message, "success");
    if (state.status === "error" && state.message && !state.fieldErrors) {
      toast(state.message, "error");
    }
    // `key` changes on every action response, so repeat saves still notify.
  }, [state.key, state.status, state.message, state.fieldErrors, toast]);
}

export function FormCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border-base bg-bg-raised p-5 sm:p-6", className)}>
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
    <section className="border-t border-border-base pt-6 first:border-0 first:pt-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-[13px] text-fg-subtle">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
