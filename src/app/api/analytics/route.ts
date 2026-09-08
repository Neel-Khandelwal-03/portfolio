import { NextResponse } from "next/server";
import { z } from "zod";

import { getSiteSettings, recordAnalyticsEvent } from "@/services/portfolio";

export const runtime = "nodejs";

/**
 * Only these event names are stored. An allowlist keeps the table from becoming
 * a write-anything endpoint for anyone who finds it.
 */
const eventSchema = z.object({
  name: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9_]+$/, "invalid event name"),
  detail: z.string().trim().max(240).optional().nullable(),
});

const ALLOWED_PREFIXES = ["page_view", "project_", "social_", "resume_", "contact_"] as const;

export async function POST(request: Request) {
  try {
    const settings = await getSiteSettings();
    if (!settings.analyticsEnabled) {
      return new NextResponse(null, { status: 204 });
    }

    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success) return new NextResponse(null, { status: 204 });

    const { name, detail } = parsed.data;
    if (!ALLOWED_PREFIXES.some((prefix) => name.startsWith(prefix))) {
      return new NextResponse(null, { status: 204 });
    }

    await recordAnalyticsEvent(name, detail ?? null);
  } catch {
    // Analytics failures are never surfaced to the visitor.
  }

  return new NextResponse(null, { status: 204 });
}
