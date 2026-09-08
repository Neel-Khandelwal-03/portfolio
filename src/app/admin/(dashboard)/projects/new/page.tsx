import Link from "next/link";

import { ProjectForm } from "@/app/admin/(dashboard)/projects/project-form";
import { AdminPageHeader } from "@/components/admin/shell";
import { ArrowLeftIcon } from "@/components/ui/icons";

export default function NewProjectPage() {
  return (
    <>
      <Link
        href="/admin/projects"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-2 text-[13px] font-medium"
      >
        <ArrowLeftIcon width={14} height={14} />
        All projects
      </Link>

      <AdminPageHeader
        title="New project"
        description="It appears on the public site as soon as you save it as published."
      />

      <ProjectForm />
    </>
  );
}
