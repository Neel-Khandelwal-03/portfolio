"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { login } from "@/lib/auth";
import { destroySession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string; fieldErrors?: Record<string, string> };

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      error: "Please check the form.",
      fieldErrors: {
        ...(fieldErrors.email ? { email: fieldErrors.email[0] } : {}),
        ...(fieldErrors.password ? { password: fieldErrors.password[0] } : {}),
      },
    };
  }

  const result = await login(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.error };

  // Only allow relative paths — an attacker-supplied `next` must never become
  // an open redirect to another site.
  const raw = String(formData.get("next") ?? "");
  const target = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin";

  redirect(target);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
