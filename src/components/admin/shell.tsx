"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  AcademicIcon,
  BriefcaseIcon,
  CertificateIcon,
  CloseIcon,
  CodeIcon,
  DocumentIcon,
  GlobeIcon,
  LogoutIcon,
  MailIcon,
  MenuIcon,
  SparkIcon,
  TrophyIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: SparkIcon, exact: true },
  { href: "/admin/profile", label: "Profile", Icon: GlobeIcon },
  { href: "/admin/skills", label: "Skills", Icon: CodeIcon },
  { href: "/admin/projects", label: "Projects", Icon: BriefcaseIcon },
  { href: "/admin/experience", label: "Experience", Icon: BriefcaseIcon },
  { href: "/admin/education", label: "Education", Icon: AcademicIcon },
  { href: "/admin/certifications", label: "Certifications", Icon: CertificateIcon },
  { href: "/admin/achievements", label: "Achievements", Icon: TrophyIcon },
  { href: "/admin/resume", label: "Resume", Icon: DocumentIcon },
  { href: "/admin/social-links", label: "Social links", Icon: GlobeIcon },
  { href: "/admin/media", label: "Media", Icon: UploadIcon },
  { href: "/admin/messages", label: "Messages", Icon: MailIcon },
  { href: "/admin/settings", label: "Site settings", Icon: SparkIcon },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  user,
  unreadMessages,
  logout,
  children,
}: {
  user: { name: string; email: string };
  unreadMessages: number;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Admin sections" className="space-y-0.5">
      {NAV.map(({ href, label, Icon, exact }) => {
        const active = isActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150",
              active
                ? "bg-accent-soft text-accent"
                : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
            )}
          >
            <Icon width={15} height={15} className="shrink-0" />
            <span className="flex-1">{label}</span>
            {href === "/admin/messages" && unreadMessages > 0 ? (
              <span className="bg-accent text-accent-fg rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                {unreadMessages}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="bg-bg-subtle min-h-dvh">
      {/* Top bar */}
      <header className="border-border-base bg-bg sticky top-0 z-40 border-b">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            aria-expanded={open}
            className="border-border-base text-fg-muted hover:text-fg grid h-9 w-9 place-items-center rounded-lg border lg:hidden"
          >
            <MenuIcon width={18} height={18} />
          </button>

          <Link href="/admin" className="text-sm font-semibold tracking-tight">
            Portfolio CMS
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="border-border-base text-fg-muted hover:text-fg hidden rounded-lg border px-3 py-1.5 text-[13px] font-medium sm:inline-flex"
            >
              View site
            </Link>
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="border-border-base text-fg-muted hover:text-fg inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium"
              >
                <LogoutIcon width={14} height={14} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="border-border-base bg-bg sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r p-3 lg:block">
          {nav}
          <div className="border-border-base mt-6 border-t px-3 pt-4">
            <p className="truncate text-[13px] font-medium">{user.name}</p>
            <p className="text-fg-subtle truncate text-xs">{user.email}</p>
          </div>
        </aside>

        {/* Mobile drawer */}
        {open ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            className="fixed inset-0 z-50 lg:hidden"
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-black/45"
            />
            <div className="border-border-base bg-bg absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold">Portfolio CMS</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  autoFocus
                  className="border-border-base text-fg-muted grid h-8 w-8 place-items-center rounded-lg border"
                >
                  <CloseIcon width={16} height={16} />
                </button>
              </div>
              {nav}
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

/** Page heading used by every admin screen. */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description ? <p className="text-fg-muted mt-1.5 text-sm">{description}</p> : null}
      </div>
      {action ? <div className="flex gap-2">{action}</div> : null}
    </div>
  );
}
