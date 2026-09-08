import { AdminPageHeader } from "@/components/admin/shell";
import { ProfileForm } from "@/app/admin/(dashboard)/profile/profile-form";
import { getProfileForAdmin } from "@/services/portfolio";

export default async function ProfileAdminPage() {
  const profile = await getProfileForAdmin();

  return (
    <>
      <AdminPageHeader
        title="Profile"
        description="Your name, headline and the text shown in the hero, about and contact sections."
      />
      <ProfileForm profile={profile} />
    </>
  );
}
