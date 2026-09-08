import Link from "next/link";

import { EducationForm } from "@/app/admin/(dashboard)/education/education-form";
import { AdminPageHeader } from "@/components/admin/shell";
import { ArrowLeftIcon } from "@/components/ui/icons";

export default function NewEducationPage() {
  return (
    <>
      <Link
        href="/admin/education"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-2 text-[13px] font-medium"
      >
        <ArrowLeftIcon width={14} height={14} />
        All education
      </Link>
      <AdminPageHeader title="New education entry" />
      <EducationForm />
    </>
  );
}
