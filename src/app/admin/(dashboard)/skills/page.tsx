import { SkillsManager } from "@/app/admin/(dashboard)/skills/skills-manager";
import { AdminPageHeader } from "@/components/admin/shell";
import { getSkillGroupsForAdmin } from "@/services/portfolio";

export default async function SkillsAdminPage() {
  const groups = await getSkillGroupsForAdmin();

  return (
    <>
      <AdminPageHeader
        title="Skills"
        description="Grouped into categories. Reorder with the arrows — the public site uses the same order."
      />
      <SkillsManager groups={groups} />
    </>
  );
}
