import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteEducationAction } from "@/app/admin/actions";
import { EducationForm } from "@/app/admin/(dashboard)/education/education-form";
import { DeleteButton } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { formatTimestamp } from "@/lib/utils";
import { getEducationById } from "@/services/portfolio";

export default async function EditEducationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entryId = Number(id);
  if (!Number.isInteger(entryId)) notFound();

  const entry = await getEducationById(entryId);
  if (!entry) notFound();

  return (
    <>
      <Link
        href="/admin/education"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-2 text-[13px] font-medium"
      >
        <ArrowLeftIcon width={14} height={14} />
        All education
      </Link>
      <AdminPageHeader
        title={entry.institution}
        description={`Last updated ${formatTimestamp(entry.updatedAt)}`}
        action={
          <DeleteButton
            id={entry.id}
            label={entry.institution}
            entity="Education entry"
            action={deleteEducationAction}
          />
        }
      />
      <EducationForm education={entry} />
    </>
  );
}
