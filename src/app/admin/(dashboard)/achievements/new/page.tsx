import Link from "next/link";

import { AchievementForm } from "@/app/admin/(dashboard)/achievements/achievement-form";
import { AdminPageHeader } from "@/components/admin/shell";
import { ArrowLeftIcon } from "@/components/ui/icons";

export default function NewAchievementPage() {
  return (
    <>
      <Link
        href="/admin/achievements"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-2 text-[13px] font-medium"
      >
        <ArrowLeftIcon width={14} height={14} />
        All achievements
      </Link>
      <AdminPageHeader title="New achievement" />
      <AchievementForm />
    </>
  );
}
