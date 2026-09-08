import { ImageResponse } from "next/og";

import { getProfile } from "@/services/portfolio";

export const runtime = "nodejs";
export const alt = "Neel Khandelwal — Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social preview card, rendered from the database at build time.
 *
 * Keeping it generated means the card follows the profile: change the headline
 * in the CMS and the next revalidation produces a matching image, with no
 * design file to keep in sync.
 */
export default async function OpengraphImage() {
  const profile = await getProfile();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0e14",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#7aa2f7" }} />
          <div style={{ color: "#79838f", fontSize: 22, letterSpacing: 3 }}>PORTFOLIO</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#e7eaf0", fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>
            {profile.fullName}
          </div>
          {profile.headline ? (
            <div style={{ color: "#7aa2f7", fontSize: 34, marginTop: 16 }}>
              {profile.headline}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              height: 4,
              width: 88,
              background: "#7aa2f7",
              borderRadius: 999,
            }}
          />
          <div style={{ color: "#a2abba", fontSize: 24 }}>
            {profile.location || "Software Engineer"}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
