import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteProjectAction } from "@/app/admin/actions";
import { ProjectForm } from "@/app/admin/(dashboard)/projects/project-form";
import { DeleteButton } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { ArrowLeftIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { formatTimestamp } from "@/lib/utils";
import { getProjectById } from "@/services/portfolio";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) notFound();

  const project = await getProjectById(projectId);
  if (!project) notFound();

  return (
    <>
      <Link
        href="/admin/projects"
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon width={14} height={14} />
        All projects
      </Link>

      <AdminPageHeader
        title={project.title}
        description={`Last updated ${formatTimestamp(project.updatedAt)}`}
        action={
          <div className="flex items-center gap-2">
            {project.isPublished ? (
              <Link
                href={`/projects/${project.slug}`}
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-base px-3 text-[13px] font-medium hover:bg-bg-subtle"
              >
                <ExternalLinkIcon width={14} height={14} />
                View live
              </Link>
            ) : null}
            <DeleteButton
              id={project.id}
              label={project.title}
              entity="Project"
              action={deleteProjectAction}
            />
          </div>
        }
      />

      <ProjectForm project={project} />
    </>
  );
}
