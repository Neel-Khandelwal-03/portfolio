import { NextResponse } from "next/server";

import { assertSameOrigin, requireAdminApi } from "@/lib/auth";
import { fieldErrorsFrom } from "@/lib/action-state";
import { revalidateProject } from "@/lib/cache";
import { projectSchema } from "@/lib/validation";
import { deleteProject, getProjectById, isSlugTaken, updateProject } from "@/services/portfolio";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

async function resolveId(context: Context): Promise<number | null> {
  const { id } = await context.params;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(_request: Request, context: Context) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const id = await resolveId(context);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const project = await getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ project }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(request: Request, context: Context) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  if (!(await assertSameOrigin(request))) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  const id = await resolveId(context);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const before = await getProjectById(id);
  if (!before) return NextResponse.json({ error: "Not found." }, { status: 404 });

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

  if (await isSlugTaken(parsed.data.slug, id)) {
    return NextResponse.json(
      { error: "Validation failed.", fieldErrors: { slug: "Slug already in use." } },
      { status: 409 },
    );
  }

  const project = await updateProject(id, parsed.data);
  // Both slugs, so renaming does not leave the old URL cached.
  revalidateProject([before.slug, parsed.data.slug], "route");

  return NextResponse.json({ project }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(request: Request, context: Context) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  if (!(await assertSameOrigin(request))) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  const id = await resolveId(context);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const removed = await deleteProject(id);
  if (!removed) return NextResponse.json({ error: "Not found." }, { status: 404 });

  revalidateProject([removed.slug], "route");

  return NextResponse.json({ deleted: removed.slug }, { headers: { "cache-control": "no-store" } });
}
