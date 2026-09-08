import Link from "next/link";

import { deleteEducationAction, moveEducationAction } from "@/app/admin/actions";
import { AdminRow, DeleteButton, OrderControls } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { EmptyState } from "@/components/ui";
import { EditIcon, PlusIcon } from "@/components/ui/icons";
import { formatDateRange } from "@/lib/utils";
import { listEducationForAdmin } from "@/services/portfolio";

export default async function EducationAdminPage() {
  const entries = await listEducationForAdmin();

  const newLink = (
    <Link
      href="/admin/education/new"
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
    >
      <PlusIcon width={15} height={15} />
      New entry
    </Link>
  );

  return (
    <>
      <AdminPageHeader title="Education" description="Degrees and institutions." action={newLink} />

      {entries.length === 0 ? (
        <EmptyState title="No education entries yet" action={newLink} />
      ) : (
        <ul className="space-y-2">
          {entries.map((item, index) => (
            <AdminRow key={item.id}>
              <OrderControls
                id={item.id}
                label={item.institution}
                isFirst={index === 0}
                isLast={index === entries.length - 1}
                action={moveEducationAction}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/education/${item.id}`}
                  className="text-sm font-semibold hover:text-accent"
                >
                  {item.institution}
                </Link>
                <p className="mt-1 text-[12px] text-fg-subtle">
                  {item.degree}
                  {item.field ? ` · ${item.field}` : ""} ·{" "}
                  {formatDateRange(item.startDate, item.endDate)}
                  {item.grade ? ` · ${item.grade}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/education/${item.id}`}
                  aria-label={`Edit ${item.institution}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-fg-subtle hover:bg-bg-subtle hover:text-fg"
                >
                  <EditIcon width={14} height={14} />
                </Link>
                <DeleteButton
                  id={item.id}
                  label={item.institution}
                  entity="Education entry"
                  action={deleteEducationAction}
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
