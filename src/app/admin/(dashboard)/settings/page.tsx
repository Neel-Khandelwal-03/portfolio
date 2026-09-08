import { AdminPageHeader } from "@/components/admin/shell";
import { SettingsForm } from "@/app/admin/(dashboard)/settings/settings-form";
import { getSiteSettingsForAdmin } from "@/services/portfolio";

export default async function SettingsAdminPage() {
  const settings = await getSiteSettingsForAdmin();

  return (
    <>
      <AdminPageHeader
        title="Site settings"
        description="SEO metadata, the footer and site-wide feature switches."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
