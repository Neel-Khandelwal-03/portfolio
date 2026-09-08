import { NextResponse } from "next/server";

import { readLocalFile } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Serves files stored by the local upload adapter.
 *
 * Only used when no blob token is configured — in production, uploads live on
 * the blob store and are served straight from its CDN, so this route is never
 * hit for those. Path traversal is rejected inside `readLocalFile`, and only
 * extensions on the upload allowlist resolve to a content type.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const file = await readLocalFile(segments);

  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "content-type": file.contentType,
      "content-length": String(file.body.byteLength),
      "cache-control": "public, max-age=31536000, immutable",
      // Belt and braces: these files are user-supplied, so never let a browser
      // sniff them into something executable.
      "x-content-type-options": "nosniff",
      "content-disposition": "inline",
    },
  });
}
