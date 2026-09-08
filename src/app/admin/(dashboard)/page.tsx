import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/shell";
import {
  AcademicIcon,
  BriefcaseIcon,
  CertificateIcon,
  CodeIcon,
  MailIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import { formatTimestamp } from "@/lib/utils";
import { storageProviderName } from "@/lib/storage";
import { getDashboardStats, getProfile } from "@/services/portfolio";

export default async function DashboardPage() {
  const [stats, profile] = await Promise.all([getDashboardStats(), getProfile()]);

  const cards = [
    {
      label: "Projects",
      value: stats.projects,
      note: `${stats.publishedProjects} published`,
      href: "/admin/projects",
      Icon: BriefcaseIcon,
    },
    {
      label: "Experience",
      value: stats.experiences,
      note: "roles & internships",
      href: "/admin/experience",
      Icon: BriefcaseIcon,
    },
    {
      label: "Skills",
      value: stats.skills,
      note: "across all categories",
      href: "/admin/skills",
      Icon: CodeIcon,
    },
    {
      label: "Certifications",
      value: stats.certifications,
      note: "credentials",
      href: "/admin/certifications",
      Icon: CertificateIcon,
    },
    {
      label: "Education",
      value: stats.education,
      note: "entries",
      href: "/admin/education",
      Icon: AcademicIcon,
    },
    {
      label: "Achievements",
      value: stats.achievements,
      note: "entries",
      href: "/admin/achievements",
      Icon: TrophyIcon,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={`Welcome back, ${profile.fullName.split(" ")[0]}`}
        description="Everything on your public portfolio is managed from here."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, note, href, Icon }) => (
          <Link
            key={label}
            href={href}
            className="border-border-base bg-bg-raised hover:border-border-strong rounded-xl border p-5 transition-colors duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-fg-muted text-[13px] font-medium">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
                <p className="text-fg-subtle mt-1 text-[13px]">{note}</p>
              </div>
              <Icon width={18} height={18} className="text-accent" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <div className="border-border-base bg-bg-raised rounded-xl border p-5">
          <h2 className="text-sm font-semibold">Site status</h2>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Content last updated</dt>
              <dd className="text-right font-medium">{formatTimestamp(stats.lastUpdated)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Resume</dt>
              <dd className="text-right font-medium">
                {profile.resumeUrl ? (
                  <span className="text-success">Uploaded</span>
                ) : (
                  <Link href="/admin/resume" className="text-accent hover:underline">
                    Not uploaded
                  </Link>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Availability</dt>
              <dd className="text-right font-medium">
                {profile.availableForWork ? "Open to roles" : "Not looking"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">File storage</dt>
              <dd className="text-right font-medium">{storageProviderName()}</dd>
            </div>
          </dl>
        </div>

        <div className="border-border-base bg-bg-raised rounded-xl border p-5">
          <h2 className="text-sm font-semibold">Messages</h2>
          <p className="mt-4 text-2xl font-semibold tabular-nums">{stats.unreadMessages}</p>
          <p className="text-fg-subtle mt-1 text-[13px]">unread from the contact form</p>
          <Link
            href="/admin/messages"
            className="text-accent mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
          >
            <MailIcon width={14} height={14} />
            Open inbox
          </Link>
        </div>
      </div>

      <div className="border-border-base bg-bg-raised mt-6 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">How saving works</h2>
        <p className="text-fg-muted mt-2 max-w-2xl text-[13px] leading-relaxed">
          Saving here writes to the database and immediately clears the cache tags for whatever you
          changed. The public site regenerates the affected pages on the next request — no rebuild,
          no redeploy, and no code change is ever needed for content.
        </p>
      </div>
    </>
  );
}
