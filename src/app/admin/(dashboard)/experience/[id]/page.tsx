import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteExperienceAction } from "@/app/admin/actions";
import { ExperienceForm } from "@/app/admin/(dashboard)/experience/experience-form";
import { DeleteButton } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { formatTimestamp } from "@/lib/utils";
import { getExperienceById } from "@/services/portfolio";

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const experienceId = Number(id);
  if (!Number.isInteger(experienceId)) notFound();

  const experience = await getExperienceById(experienceId);
  if (!experience) notFound();

  return (
    <>
      <Link
        href="/admin/experience"
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon width={14} height={14} />
        All experience
      </Link>

      <AdminPageHeader
        title={`${experience.role} at ${experience.company}`}
        description={`Last updated ${formatTimestamp(experience.updatedAt)}`}
        action={
          <DeleteButton
            id={experience.id}
            label={`${experience.role} at ${experience.company}`}
            entity="Experience"
            action={deleteExperienceAction}
          />
        }
      />

      <ExperienceForm experience={experience} />
    </>
  );
}
