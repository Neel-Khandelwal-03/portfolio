import Link from "next/link";

import { deleteExperienceAction, moveExperienceAction } from "@/app/admin/actions";
import { AdminRow, DeleteButton, OrderControls } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { Badge, EmptyState } from "@/components/ui";
import { EditIcon, PlusIcon } from "@/components/ui/icons";
import { formatDateRange } from "@/lib/utils";
import { listExperiencesForAdmin } from "@/services/portfolio";

export default async function ExperienceAdminPage() {
  const experiences = await listExperiencesForAdmin();

  const newLink = (
    <Link
      href="/admin/experience/new"
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
    >
      <PlusIcon width={15} height={15} />
      New experience
    </Link>
  );

  return (
    <>
      <AdminPageHeader
        title="Experience"
        description="Internships and roles, shown as a timeline on the public site."
        action={newLink}
      />

      {experiences.length === 0 ? (
        <EmptyState
          title="No experience added yet"
          description="Add your internships and roles here."
          action={newLink}
        />
      ) : (
        <ul className="space-y-2">
          {experiences.map((item, index) => (
            <AdminRow key={item.id}>
              <OrderControls
                id={item.id}
                label={`${item.role} at ${item.company}`}
                isFirst={index === 0}
                isLast={index === experiences.length - 1}
                action={moveExperienceAction}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/experience/${item.id}`}
                    className="text-sm font-semibold hover:text-accent"
                  >
                    {item.role}
                  </Link>
                  <span className="text-fg-subtle" aria-hidden>·</span>
                  <span className="text-sm text-fg-muted">{item.company}</span>
                  {item.isPublished ? null : <Badge tone="warning">Hidden</Badge>}
                </div>
                <p className="mt-1 text-[12px] text-fg-subtle">
                  {formatDateRange(item.startDate, item.endDate)} · {item.employmentType}
                  {item.location ? ` · ${item.location}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/experience/${item.id}`}
                  aria-label={`Edit ${item.role} at ${item.company}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-fg-subtle hover:bg-bg-subtle hover:text-fg"
                >
                  <EditIcon width={14} height={14} />
                </Link>
                <DeleteButton
                  id={item.id}
                  label={`${item.role} at ${item.company}`}
                  entity="Experience"
                  action={deleteExperienceAction}
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
