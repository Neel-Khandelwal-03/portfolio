import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/admin/login/login-form";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

// The login form must never be served from a cache.
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // A visitor who already holds a valid session should not see a login form.
  if (await getSessionUser()) redirect("/admin");

  const { next } = await searchParams;
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  return (
    <div className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-accent font-mono text-[11px] font-semibold tracking-[0.16em] uppercase">
            Admin
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-fg-muted mt-2 text-sm">Manage the content of your portfolio.</p>
        </div>

        <LoginForm next={target} />

        <p className="text-fg-subtle mt-6 text-center text-[13px]">
          <Link href="/" className="hover:text-fg">
            Back to the portfolio
          </Link>
        </p>
      </div>
    </div>
  );
}
