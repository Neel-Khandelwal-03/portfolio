import { ImageResponse } from "next/og";

import { sketchWhiteboard, type WhiteboardTone } from "@/lib/whiteboard";
import { getProjectBySlug } from "@/services/portfolio";

export const alt = "Project case study by Neel Khandelwal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Colours for the card's own dark ground, rather than the whiteboard's light
 * one. The diagram sits behind the text here, so it is drawn quiet.
 */
const STROKE: Record<WhiteboardTone, string> = {
  ink: "#69738a",
  blue: "#7aa2f7",
  red: "#b8635a",
  green: "#4f9d78",
};

/**
 * The project's whiteboard as a data URI, strokes only.
 *
 * The card renderer draws SVG through an `<img>`, and text inside that SVG
 * would need its own embedded font — so the labels are dropped and the shapes
 * are used as the card's artwork.
 */
function boardArtwork(board: Parameters<typeof sketchWhiteboard>[0], seedKey: string) {
  const sketch = sketchWhiteboard(board, seedKey);
  const paths = sketch.strokes
    .map(
      (stroke) =>
        `<path d="${stroke.d}" fill="none" stroke="${STROKE[stroke.tone]}" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round"${
          stroke.dashed ? ' stroke-dasharray="7 7"' : ""
        }/>`,
    )
    .join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sketch.x} ${sketch.y} ${sketch.width} ${sketch.height}" ` +
    `width="${sketch.width}" height="${sketch.height}">${paths}</svg>`;

  return {
    src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    ratio: sketch.width / sketch.height,
  };
}

export default async function ProjectOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0e14",
          color: "#e7eaf0",
          fontSize: 48,
          fontFamily: "sans-serif",
        }}
      >
        Neel Khandelwal
      </div>,
      size,
    );
  }

  const artwork = project.whiteboard ? boardArtwork(project.whiteboard, project.slug) : null;
  const metrics = project.metrics.slice(0, 3);
  // Trim at a word boundary: a card cut mid-word reads as a rendering bug.
  const summary =
    project.summary.length > 150
      ? `${project.summary.slice(0, 147).replace(/\s+\S*$/, "")}…`
      : project.summary;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0b0e14",
        padding: 68,
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* The diagram fills the right edge behind the text column, which is
          held to the left half so the two never overlap. */}
      {artwork ? (
        // eslint-disable-next-line @next/next/no-img-element -- the card renderer has no next/image
        <img
          alt=""
          src={artwork.src}
          width={560}
          height={Math.round(560 / artwork.ratio)}
          style={{ position: "absolute", right: -40, bottom: 96, opacity: 0.3 }}
        />
      ) : null}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#7aa2f7" }} />
          <div style={{ color: "#79838f", fontSize: 20, letterSpacing: 3 }}>
            {project.category.toUpperCase()}
          </div>
        </div>
        <div style={{ color: "#79838f", fontSize: 22, display: "flex" }}>Neel Khandelwal</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
        <div style={{ color: "#e7eaf0", fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>
          {project.title}
        </div>
        {summary ? (
          <div style={{ color: "#a2abba", fontSize: 28, marginTop: 20, lineHeight: 1.35 }}>
            {summary}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", maxWidth: 620 }}>
        {metrics.length > 0 ? (
          <div style={{ display: "flex", gap: 56 }}>
            {metrics.map((metric, index) => (
              <div key={index} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "#e7eaf0", fontSize: 40, fontWeight: 700 }}>
                  {metric.value}
                </div>
                <div style={{ color: "#79838f", fontSize: 20, marginTop: 6 }}>{metric.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 14 }}>
            {project.technologies.slice(0, 5).map((tech) => (
              <div
                key={tech}
                style={{
                  color: "#a2abba",
                  fontSize: 20,
                  border: "1px solid #232a36",
                  borderRadius: 8,
                  padding: "8px 14px",
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    size,
  );
}
