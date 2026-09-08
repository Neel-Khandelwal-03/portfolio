import Link from "next/link";

import { deleteCertificationAction, moveCertificationAction } from "@/app/admin/actions";
import { AdminRow, DeleteButton, OrderControls } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { EmptyState } from "@/components/ui";
import { EditIcon, PlusIcon } from "@/components/ui/icons";
import { formatMonthYear } from "@/lib/utils";
import { listCertificationsForAdmin } from "@/services/portfolio";

export default async function CertificationsAdminPage() {
  const items = await listCertificationsForAdmin();

  const newLink = (
    <Link
      href="/admin/certifications/new"
      className="bg-accent text-accent-fg hover:bg-accent-hover inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium"
    >
      <PlusIcon width={15} height={15} />
      New certification
    </Link>
  );

  return (
    <>
      <AdminPageHeader
        title="Certifications"
        description="Credentials with verification links and certificate files."
        action={newLink}
      />

      {items.length === 0 ? (
        <EmptyState title="No certifications yet" action={newLink} />
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <AdminRow key={item.id}>
              <OrderControls
                id={item.id}
                label={item.name}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                action={moveCertificationAction}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/certifications/${item.id}`}
                  className="hover:text-accent text-sm font-semibold"
                >
                  {item.name}
                </Link>
                <p className="text-fg-subtle mt-1 truncate text-[12px]">
                  {item.issuer}
                  {item.issueDate ? ` · ${formatMonthYear(item.issueDate)}` : ""}
                  {item.credentialId ? ` · ${item.credentialId}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/certifications/${item.id}`}
                  aria-label={`Edit ${item.name}`}
                  className="text-fg-subtle hover:bg-bg-subtle hover:text-fg grid h-8 w-8 place-items-center rounded-lg"
                >
                  <EditIcon width={14} height={14} />
                </Link>
                <DeleteButton
                  id={item.id}
                  label={item.name}
                  entity="Certification"
                  action={deleteCertificationAction}
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
