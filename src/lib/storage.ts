import "server-only";

import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Pluggable object storage.
 *
 * Binary files never go into Postgres. In production, uploads go to Vercel
 * Blob; with no blob token configured they are written to `.data/uploads` and
 * served through `/api/media/*`, which keeps local development working with no
 * cloud account. The database only ever stores the resulting URL.
 */

export type StorageProvider = "blob" | "local";

export type StoredFile = {
  url: string;
  pathname: string;
  provider: StorageProvider;
  contentType: string;
  size: number;
  originalName: string;
  kind: "image" | "document";
};

export type UploadKind = "image" | "document" | "any";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Allowlist of accepted types with their magic-byte signatures.
 *
 * The declared MIME type and the file extension are both attacker-controlled,
 * so the leading bytes are checked as well. SVG is deliberately absent: it can
 * carry script and would be served from this origin.
 */
const SIGNATURES: Record<
  string,
  { extension: string; kind: "image" | "document"; matches: (bytes: Uint8Array) => boolean }
> = {
  "image/png": {
    extension: "png",
    kind: "image",
    matches: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  "image/jpeg": {
    extension: "jpg",
    kind: "image",
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  "image/webp": {
    extension: "webp",
    kind: "image",
    matches: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
  "image/avif": {
    extension: "avif",
    kind: "image",
    // ISO-BMFF: bytes 4-7 are "ftyp", then a brand containing "avif".
    matches: (b) =>
      b[4] === 0x66 &&
      b[5] === 0x74 &&
      b[6] === 0x79 &&
      b[7] === 0x70 &&
      String.fromCharCode(b[8], b[9], b[10], b[11]).startsWith("avi"),
  },
  "application/pdf": {
    extension: "pdf",
    kind: "document",
    matches: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
};

export class UploadError extends Error {}

const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Validates a file and returns its verified type. Throws `UploadError` otherwise. */
async function validate(file: File, accept: UploadKind) {
  if (file.size === 0) throw new UploadError("The file is empty.");

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const declared = file.type || "";
  const signature = SIGNATURES[declared];

  if (!signature) {
    throw new UploadError(
      "Unsupported file type. Allowed: PNG, JPEG, WebP, AVIF and PDF.",
    );
  }

  if (!signature.matches(head)) {
    throw new UploadError(
      `The file contents do not match its declared type (${declared}). Upload was rejected.`,
    );
  }

  if (accept !== "any" && signature.kind !== accept) {
    throw new UploadError(
      accept === "image" ? "Please upload an image." : "Please upload a PDF document.",
    );
  }

  const limit = signature.kind === "image" ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size > limit) {
    throw new UploadError(
      `File is too large. The limit is ${Math.round(limit / 1024 / 1024)} MB.`,
    );
  }

  return signature;
}

/**
 * Builds the stored path.
 *
 * The name is generated, never taken from the upload, so a crafted filename
 * cannot traverse directories or land with a second extension.
 */
function buildPathname(folder: string, extension: string): string {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "misc";
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${safeFolder}/${stamp}/${randomBytes(12).toString("hex")}.${extension}`;
}

export async function uploadFile(
  file: File,
  options: { folder: string; accept?: UploadKind },
): Promise<StoredFile> {
  const signature = await validate(file, options.accept ?? "any");
  const pathname = buildPathname(options.folder, signature.extension);
  const contentType = file.type;

  const common = {
    pathname,
    contentType,
    size: file.size,
    originalName: file.name.slice(0, 255),
    kind: signature.kind,
  };

  if (blobConfigured()) {
    const { put } = await import("@vercel/blob");
    const result = await put(pathname, file, {
      access: "public",
      contentType,
      // The pathname is already random; adding a suffix would break the
      // deterministic delete path.
      addRandomSuffix: false,
      cacheControlMaxAge: 31_536_000,
    });

    return { ...common, url: result.url, provider: "blob" };
  }

  const target = path.join(LOCAL_ROOT, pathname);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, Buffer.from(await file.arrayBuffer()));

  return { ...common, url: `/api/media/${pathname}`, provider: "local" };
}

export async function deleteStoredFile(
  pathname: string,
  provider: StorageProvider,
): Promise<void> {
  if (provider === "blob") {
    const { del } = await import("@vercel/blob");
    // Vercel Blob deletes by URL; the stored URL is rebuilt from the token host
    // by the SDK when given a pathname-shaped key, so pass the full URL when we
    // have it. Callers pass the URL for blob files.
    await del(pathname);
    return;
  }

  // Re-resolve and confirm the path stays inside the upload root.
  const target = path.resolve(LOCAL_ROOT, pathname);
  if (!target.startsWith(path.resolve(LOCAL_ROOT))) return;

  await fs.rm(target, { force: true });
}

/** Reads a locally stored file for `/api/media/*`. Returns null if absent. */
export async function readLocalFile(
  segments: string[],
): Promise<{ body: Buffer; contentType: string } | null> {
  // Reject traversal before touching the filesystem.
  if (segments.some((segment) => segment === ".." || segment.includes("\\") || segment === "")) {
    return null;
  }

  const target = path.resolve(LOCAL_ROOT, ...segments);
  if (!target.startsWith(path.resolve(LOCAL_ROOT))) return null;

  const extension = path.extname(target).slice(1).toLowerCase();
  const contentType = Object.entries(SIGNATURES).find(
    ([, value]) => value.extension === extension,
  )?.[0];

  if (!contentType) return null;

  try {
    return { body: await fs.readFile(target), contentType };
  } catch {
    return null;
  }
}

export function storageProviderName(): string {
  return blobConfigured() ? "Vercel Blob" : "local filesystem (.data/uploads)";
}
