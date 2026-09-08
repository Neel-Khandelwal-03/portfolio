import Link from "next/link";

import { deleteAchievementAction, moveAchievementAction } from "@/app/admin/actions";
import { AdminRow, DeleteButton, OrderControls } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { EmptyState } from "@/components/ui";
import { EditIcon, PlusIcon } from "@/components/ui/icons";
import { formatFullDate } from "@/lib/utils";
import { listAchievementsForAdmin } from "@/services/portfolio";

export default async function AchievementsAdminPage() {
  const items = await listAchievementsForAdmin();

  const newLink = (
    <Link
      href="/admin/achievements/new"
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
    >
      <PlusIcon width={15} height={15} />
      New achievement
    </Link>
  );

  return (
    <>
      <AdminPageHeader
        title="Achievements"
        description="Hackathons, rankings, publications and open-source work."
        action={newLink}
      />

      {items.length === 0 ? (
        <EmptyState title="No achievements yet" action={newLink} />
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <AdminRow key={item.id}>
              <OrderControls
                id={item.id}
                label={item.title}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                action={moveAchievementAction}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/achievements/${item.id}`}
                  className="text-sm font-semibold hover:text-accent"
                >
                  {item.title}
                </Link>
                <p className="mt-1 truncate text-[12px] text-fg-subtle">
                  {item.organization || "No organisation"}
                  {item.date ? ` · ${formatFullDate(item.date)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/achievements/${item.id}`}
                  aria-label={`Edit ${item.title}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-fg-subtle hover:bg-bg-subtle hover:text-fg"
                >
                  <EditIcon width={14} height={14} />
                </Link>
                <DeleteButton
                  id={item.id}
                  label={item.title}
                  entity="Achievement"
                  action={deleteAchievementAction}
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
