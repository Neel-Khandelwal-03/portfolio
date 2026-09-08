import Link from "next/link";

import { CertificationForm } from "@/app/admin/(dashboard)/certifications/certification-form";
import { AdminPageHeader } from "@/components/admin/shell";
import { ArrowLeftIcon } from "@/components/ui/icons";

export default function NewCertificationPage() {
  return (
    <>
      <Link
        href="/admin/certifications"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-2 text-[13px] font-medium"
      >
        <ArrowLeftIcon width={14} height={14} />
        All certifications
      </Link>
      <AdminPageHeader title="New certification" />
      <CertificationForm />
    </>
  );
}
