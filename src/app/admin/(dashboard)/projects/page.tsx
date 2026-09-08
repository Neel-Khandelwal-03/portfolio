import Link from "next/link";

import { deleteProjectAction, moveProjectAction } from "@/app/admin/actions";
import { AdminRow, DeleteButton, OrderControls } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { Badge, EmptyState } from "@/components/ui";
import { EditIcon, ExternalLinkIcon, PlusIcon } from "@/components/ui/icons";
import { listProjectsForAdmin } from "@/services/portfolio";

export default async function ProjectsAdminPage() {
  const projects = await listProjectsForAdmin();

  return (
    <>
      <AdminPageHeader
        title="Projects"
        description="Featured projects appear on the homepage; all published projects appear at /projects."
        action={
          <Link
            href="/admin/projects/new"
            className="bg-accent text-accent-fg hover:bg-accent-hover inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium"
          >
            <PlusIcon width={15} height={15} />
            New project
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Add your first project — it will appear on the public site as soon as you save."
          action={
            <Link
              href="/admin/projects/new"
              className="bg-accent text-accent-fg hover:bg-accent-hover inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium"
            >
              <PlusIcon width={15} height={15} />
              New project
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {projects.map((project, index) => (
            <AdminRow key={project.id}>
              <OrderControls
                id={project.id}
                label={project.title}
                isFirst={index === 0}
                isLast={index === projects.length - 1}
                action={moveProjectAction}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="hover:text-accent text-sm font-semibold"
                  >
                    {project.title}
                  </Link>
                  {project.isFeatured ? <Badge tone="accent">Featured</Badge> : null}
                  {project.isPublished ? (
                    <Badge tone="success">Published</Badge>
                  ) : (
                    <Badge tone="warning">Draft</Badge>
                  )}
                </div>
                <p className="text-fg-subtle mt-1 truncate font-mono text-[12px]">
                  /projects/{project.slug} · {project.category}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {project.isPublished ? (
                  <Link
                    href={`/projects/${project.slug}`}
                    target="_blank"
                    aria-label={`View ${project.title} on the public site`}
                    className="text-fg-subtle hover:bg-bg-subtle hover:text-fg grid h-8 w-8 place-items-center rounded-lg"
                  >
                    <ExternalLinkIcon width={14} height={14} />
                  </Link>
                ) : null}
                <Link
                  href={`/admin/projects/${project.id}`}
                  aria-label={`Edit ${project.title}`}
                  className="text-fg-subtle hover:bg-bg-subtle hover:text-fg grid h-8 w-8 place-items-center rounded-lg"
                >
                  <EditIcon width={14} height={14} />
                </Link>
                <DeleteButton
                  id={project.id}
                  label={project.title}
                  entity="Project"
                  action={deleteProjectAction}
                  compact
                />
              </div>
            </AdminRow>
          ))}
        </ul>
      )}
    </>
  );
}
