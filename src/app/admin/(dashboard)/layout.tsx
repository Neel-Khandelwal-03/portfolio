import type { Metadata } from "next";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/admin/login/actions";
import { AdminShell } from "@/components/admin/shell";
import { ToastProvider } from "@/components/admin/toast";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats } from "@/services/portfolio";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The dashboard must always reflect the true current state, so nothing here is
 * cached or statically rendered.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // The real authorisation check. The middleware only looked for a cookie; this
  // resolves it against the database and redirects if it is not a live session.
  const user = await requireAdmin();
  const stats = await getDashboardStats();

  return (
    <ToastProvider>
      <AdminShell user={user} unreadMessages={stats.unreadMessages} logout={logoutAction}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
