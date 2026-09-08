import { NextResponse } from "next/server";
import { z } from "zod";

import { contactSchema } from "@/lib/validation";
import { countRecentContactMessages, createContactMessage } from "@/services/portfolio";

export const runtime = "nodejs";

/** Site-wide ceiling on inbound messages per hour — a blunt but effective flood stop. */
const MAX_MESSAGES_PER_HOUR = 20;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return NextResponse.json(
      {
        error: "Please correct the highlighted fields.",
        fieldErrors: {
          name: fieldErrors.name?.[0],
          email: fieldErrors.email?.[0],
          message: fieldErrors.message?.[0],
        },
      },
      { status: 400 },
    );
  }

  const { name, email, message, website } = parsed.data;

  // Honeypot. Answer 200 so a bot cannot tell it was filtered and retry.
  if (website) {
    return NextResponse.json({ ok: true });
  }

  try {
    if ((await countRecentContactMessages(60)) >= MAX_MESSAGES_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many messages have been sent recently. Please email me directly." },
        { status: 429 },
      );
    }

    await createContactMessage({ name, email, message });
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Log server-side; never return the underlying error to the browser.
    console.error("contact form failed:", error);
    return NextResponse.json(
      { error: "Could not send your message right now. Please email me directly." },
      { status: 500 },
    );
  }
}
