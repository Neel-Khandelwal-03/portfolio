import { deleteMediaAction } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/list";
import { AdminPageHeader } from "@/components/admin/shell";
import { EmptyState } from "@/components/ui";
import { storageProviderName } from "@/lib/storage";
import { formatBytes, formatTimestamp } from "@/lib/utils";
import { listMedia } from "@/services/portfolio";

export default async function MediaAdminPage() {
  const files = await listMedia();

  return (
    <>
      <AdminPageHeader
        title="Media"
        description={`Every file uploaded through the dashboard. Storage: ${storageProviderName()}.`}
      />

      {files.length === 0 ? (
        <EmptyState
          title="No files uploaded yet"
          description="Images and PDFs uploaded from any form appear here."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <li
              key={file.id}
              className="border-border-base bg-bg-raised flex flex-col rounded-xl border p-4"
            >
              {file.kind === "image" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={file.url}
                  alt=""
                  loading="lazy"
                  className="border-border-base bg-bg-subtle mb-3 h-32 w-full rounded-lg border object-contain"
                />
              ) : (
                <div className="border-border-base bg-bg-subtle text-fg-subtle mb-3 grid h-32 w-full place-items-center rounded-lg border font-mono text-xs">
                  PDF
                </div>
              )}

              <p className="truncate text-[13px] font-medium" title={file.originalName}>
                {file.originalName}
              </p>
              <p className="text-fg-subtle mt-1 text-[12px]">
                {formatBytes(file.size)} · {formatTimestamp(file.createdAt)}
              </p>

              <div className="border-border-base mt-3 flex items-center justify-between gap-2 border-t pt-3">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent text-[13px] font-medium hover:underline"
                >
                  Open
                </a>
                <DeleteButton
                  id={file.id}
                  label={file.originalName}
                  entity="File"
                  action={deleteMediaAction}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
