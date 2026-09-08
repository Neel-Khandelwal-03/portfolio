import Link from "next/link";

import { ExperienceForm } from "@/app/admin/(dashboard)/experience/experience-form";
import { AdminPageHeader } from "@/components/admin/shell";
import { ArrowLeftIcon } from "@/components/ui/icons";

export default function NewExperiencePage() {
  return (
    <>
      <Link
        href="/admin/experience"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-2 text-[13px] font-medium"
      >
        <ArrowLeftIcon width={14} height={14} />
        All experience
      </Link>
      <AdminPageHeader title="New experience" />
      <ExperienceForm />
    </>
  );
}
