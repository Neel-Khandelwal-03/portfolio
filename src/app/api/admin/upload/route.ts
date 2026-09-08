import { NextResponse } from "next/server";

import { assertSameOrigin, requireAdminApi } from "@/lib/auth";
import { UploadError, uploadFile } from "@/lib/storage";
import { recordMedia } from "@/services/portfolio";

export const runtime = "nodejs";
/** Uploads can take a few seconds on a slow connection. */
export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  if (!(await assertSameOrigin(request))) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was provided." }, { status: 400 });
  }

  const folder = String(formData.get("folder") ?? "misc");
  const acceptRaw = String(formData.get("accept") ?? "any");
  const accept = acceptRaw === "image" || acceptRaw === "document" ? acceptRaw : "any";

  try {
    const stored = await uploadFile(file, { folder, accept });

    // Register the file so the media library can list and clean it up later.
    await recordMedia({
      url: stored.url,
      pathname: stored.pathname,
      provider: stored.provider,
      contentType: stored.contentType,
      size: stored.size,
      originalName: stored.originalName,
      kind: stored.kind,
    });

    return NextResponse.json({ url: stored.url, kind: stored.kind, size: stored.size });
  } catch (error) {
    // UploadError messages are written for the admin and safe to show.
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("upload failed:", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
