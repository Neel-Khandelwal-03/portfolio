import { AdminPageHeader } from "@/components/admin/shell";
import { ResumeForm } from "@/app/admin/(dashboard)/resume/resume-form";
import { formatTimestamp } from "@/lib/utils";
import { getProfileForAdmin } from "@/services/portfolio";

export default async function ResumeAdminPage() {
  const profile = await getProfileForAdmin();

  return (
    <>
      <AdminPageHeader
        title="Resume"
        description="Upload a PDF. The public site links to it for both viewing and download."
      />

      <div className="max-w-2xl space-y-4">
        {profile.resumeUrl ? (
          <div className="rounded-xl border border-border-base bg-bg-raised p-5">
            <p className="text-sm font-semibold">Current resume</p>
            <p className="mt-1 text-[13px] text-fg-subtle">
              Last updated {formatTimestamp(profile.resumeUpdatedAt)}
            </p>
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-[13px] font-medium text-accent hover:underline"
            >
              Open current file
            </a>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border-strong bg-bg-subtle p-5 text-center">
            <p className="text-sm font-medium">No resume uploaded</p>
            <p className="mt-1 text-[13px] text-fg-muted">
              The resume section and hero button stay hidden until you upload one.
            </p>
          </div>
        )}

        <ResumeForm currentUrl={profile.resumeUrl} />
      </div>
    </>
  );
}
