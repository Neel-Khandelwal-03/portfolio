import { SocialLinksManager } from "@/app/admin/(dashboard)/social-links/social-links-manager";
import { AdminPageHeader } from "@/components/admin/shell";
import { listSocialLinksForAdmin } from "@/services/portfolio";

export default async function SocialLinksAdminPage() {
  const links = await listSocialLinksForAdmin();

  return (
    <>
      <AdminPageHeader
        title="Social links"
        description="Shown in the hero, contact section and footer. The platform decides which icon is used."
      />
      <SocialLinksManager links={links} />
    </>
  );
}
