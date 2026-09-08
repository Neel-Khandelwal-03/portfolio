import { NextResponse } from "next/server";

import { assertSameOrigin, requireAdminApi } from "@/lib/auth";
import { fieldErrorsFrom } from "@/lib/action-state";
import { revalidateProject } from "@/lib/cache";
import { projectSchema } from "@/lib/validation";
import * as t from "@/db/schema";
import {
  createProject,
  isSlugTaken,
  listProjectsForAdmin,
  nextDisplayOrder,
} from "@/services/portfolio";

export const runtime = "nodejs";

/**
 * Admin REST surface for projects.
 *
 * The dashboard itself uses Server Actions; this exists for scripting and
 * programmatic access. Both paths share the same validation, service layer and
 * revalidation, and both verify the session server-side — the route is never
 * trusted just because it sits under `/api/admin`.
 */

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { projects: await listProjectsForAdmin() },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  if (!(await assertSameOrigin(request))) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fieldErrors: fieldErrorsFrom(parsed.error) },
      { status: 400 },
    );
  }

  if (await isSlugTaken(parsed.data.slug)) {
    return NextResponse.json(
      { error: "Validation failed.", fieldErrors: { slug: "Slug already in use." } },
      { status: 409 },
    );
  }

  const project = await createProject({
    ...parsed.data,
    displayOrder: await nextDisplayOrder(t.projects),
  });

  revalidateProject([project.slug], "route");

  return NextResponse.json({ project }, { status: 201, headers: { "cache-control": "no-store" } });
}
