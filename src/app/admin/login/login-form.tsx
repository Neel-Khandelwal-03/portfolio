"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, type LoginState } from "@/app/admin/login/actions";
import { Card } from "@/components/ui";
import { AlertIcon, SpinnerIcon } from "@/components/ui/icons";

const FIELD =
  "w-full rounded-lg border border-border-base bg-bg px-3 py-2.5 text-sm " +
  "placeholder:text-fg-subtle focus:border-accent focus:outline-none " +
  "aria-[invalid=true]:border-danger";

function SubmitButton() {
  // `useFormStatus` reads the pending state of the enclosing form, so the
  // button disables itself during submission without any extra state.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-accent text-accent-fg hover:bg-accent-hover inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors duration-150 disabled:opacity-60"
    >
      {pending ? (
        <>
          <SpinnerIcon width={15} height={15} className="animate-spin" />
          Signing in
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        {state.error ? (
          <div
            role="alert"
            className="border-border-base bg-danger-soft flex items-start gap-2.5 rounded-lg border p-3 text-[13px]"
          >
            <AlertIcon width={15} height={15} className="text-danger mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            className={FIELD}
            placeholder="you@example.com"
          />
          {state.fieldErrors?.email ? (
            <p id="email-error" className="text-danger mt-1.5 text-[13px]">
              {state.fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
            className={FIELD}
            placeholder="••••••••••••"
          />
          {state.fieldErrors?.password ? (
            <p id="password-error" className="text-danger mt-1.5 text-[13px]">
              {state.fieldErrors.password}
            </p>
          ) : null}
        </div>

        <SubmitButton />
      </form>
    </Card>
  );
}
