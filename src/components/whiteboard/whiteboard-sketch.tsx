import { Kalam } from "next/font/google";

import { cn } from "@/lib/utils";
import { WHITEBOARD_LINE_HEIGHT, sketchWhiteboard } from "@/lib/whiteboard";
import type { Whiteboard } from "@/db/schema";

/**
 * A marker hand, scoped to the whiteboard. Next only ships the font with the
 * components that use it, so the rest of the site never downloads it.
 */
const marker = Kalam({ subsets: ["latin"], weight: "400", display: "swap" });

/**
 * Draws a whiteboard as marker strokes.
 *
 * Holds no state and runs no effects, so it renders on the server for the
 * case-study thumbnail and in the browser for the viewer and the admin
 * preview — always from the same deterministic geometry.
 *
 * Strokes carry `data-order` so the viewer can animate them in the order a
 * person would draw them: every box first, then the arrows between them.
 */
export function WhiteboardSketch({
  board,
  seedKey,
  variant = 0,
  title,
  className,
}: {
  board: Whiteboard;
  seedKey: string;
  variant?: number;
  /** Accessible name. Omit it when the sketch sits inside something already labelled. */
  title?: string;
  className?: string;
}) {
  const sketch = sketchWhiteboard(board, seedKey, variant);

  return (
    <svg
      viewBox={`${sketch.x} ${sketch.y} ${sketch.width} ${sketch.height}`}
      className={cn(marker.className, className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {sketch.strokes.map((stroke, index) => (
          <path
            key={index}
            d={stroke.d}
            style={{ stroke: `var(--wb-${stroke.tone})` }}
            strokeWidth={stroke.width}
            strokeDasharray={stroke.dashed ? "7 7" : undefined}
            data-stroke=""
            data-order={stroke.order}
            data-dashed={stroke.dashed ? "" : undefined}
          />
        ))}
      </g>

      {sketch.labels.map((label, index) => (
        <text
          key={index}
          x={label.x}
          y={label.y}
          fontSize={label.size}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fill: `var(--wb-${label.tone})` }}
          className={label.halo ? "whiteboard-halo" : undefined}
          data-label=""
          data-order={label.order}
        >
          {label.lines.map((line, lineIndex) => (
            <tspan key={lineIndex} x={label.x} dy={lineIndex === 0 ? 0 : WHITEBOARD_LINE_HEIGHT}>
              {line}
            </tspan>
          ))}
        </text>
      ))}
    </svg>
  );
}
