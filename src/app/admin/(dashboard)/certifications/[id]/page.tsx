import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteCertificationAction } from "@/app/admin/actions";
import { CertificationForm } from "@/app/admin/(dashboard)/certifications/certification-form";
import { DeleteButton } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { formatTimestamp } from "@/lib/utils";
import { getCertificationById } from "@/services/portfolio";

export default async function EditCertificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const certId = Number(id);
  if (!Number.isInteger(certId)) notFound();

  const certification = await getCertificationById(certId);
  if (!certification) notFound();

  return (
    <>
      <Link
        href="/admin/certifications"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-2 text-[13px] font-medium"
      >
        <ArrowLeftIcon width={14} height={14} />
        All certifications
      </Link>
      <AdminPageHeader
        title={certification.name}
        description={`Last updated ${formatTimestamp(certification.updatedAt)}`}
        action={
          <DeleteButton
            id={certification.id}
            label={certification.name}
            entity="Certification"
            action={deleteCertificationAction}
          />
        }
      />
      <CertificationForm certification={certification} />
    </>
  );
}
