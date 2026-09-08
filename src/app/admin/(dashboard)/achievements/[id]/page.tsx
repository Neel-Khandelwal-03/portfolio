import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteAchievementAction } from "@/app/admin/actions";
import { AchievementForm } from "@/app/admin/(dashboard)/achievements/achievement-form";
import { DeleteButton } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { formatTimestamp } from "@/lib/utils";
import { getAchievementById } from "@/services/portfolio";

export default async function EditAchievementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const achievementId = Number(id);
  if (!Number.isInteger(achievementId)) notFound();

  const achievement = await getAchievementById(achievementId);
  if (!achievement) notFound();

  return (
    <>
      <Link
        href="/admin/achievements"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-2 text-[13px] font-medium"
      >
        <ArrowLeftIcon width={14} height={14} />
        All achievements
      </Link>
      <AdminPageHeader
        title={achievement.title}
        description={`Last updated ${formatTimestamp(achievement.updatedAt)}`}
        action={
          <DeleteButton
            id={achievement.id}
            label={achievement.title}
            entity="Achievement"
            action={deleteAchievementAction}
          />
        }
      />
      <AchievementForm achievement={achievement} />
    </>
  );
}
