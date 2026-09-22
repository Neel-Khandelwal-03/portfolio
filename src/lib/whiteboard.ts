import type { Whiteboard, WhiteboardNode } from "@/db/schema";

/**
 * Project whiteboards: a system diagram drawn the way you would sketch it in a
 * design interview.
 *
 * Everything here is pure and deterministic. The same board and seed always
 * produce the same strokes, so the server-rendered SVG and the one React
 * hydrates are identical, and the admin preview is exactly what visitors see.
 */

export type WhiteboardKind = WhiteboardNode["kind"];
export type WhiteboardTone = WhiteboardNode["tone"];

export const WHITEBOARD_KINDS = [
  "box",
  "store",
  "note",
] as const satisfies readonly WhiteboardKind[];
export const WHITEBOARD_TONES = [
  "ink",
  "blue",
  "red",
  "green",
] as const satisfies readonly WhiteboardTone[];

export const WHITEBOARD_LIMITS = {
  nodes: 24,
  edges: 40,
  cols: 8,
  rows: 6,
  label: 40,
  edgeLabel: 28,
  title: 80,
  caption: 280,
} as const;

/* -------------------------------------------------------------------------- */
/* Rules                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Every structural rule a board must satisfy, phrased as something a person can
 * fix. The server schema and the admin editor both call this, so the editor
 * warns about exactly what a save would reject.
 */
export function whiteboardProblems(board: Whiteboard): string[] {
  const problems: string[] = [];
  const labels = new Map<string, string>();
  const cells = new Map<string, string>();

  for (const node of board.nodes) {
    if (labels.has(node.id)) problems.push(`Two boxes share the id "${node.id}".`);
    labels.set(node.id, node.label);

    const cell = `${node.col}:${node.row}`;
    const occupant = cells.get(cell);
    if (occupant !== undefined) {
      problems.push(
        `"${occupant}" and "${node.label}" are both in column ${node.col + 1}, row ${node.row + 1}. Move one of them.`,
      );
    } else {
      cells.set(cell, node.label);
    }
  }

  const joined = new Set<string>();
  for (const edge of board.edges) {
    const from = labels.get(edge.from);
    const to = labels.get(edge.to);

    if (from === undefined || to === undefined) {
      problems.push("An arrow points at a box that no longer exists. Remove the arrow.");
      continue;
    }
    if (edge.from === edge.to) {
      problems.push(`An arrow starts and ends on "${from}". Point it at a different box.`);
      continue;
    }

    const pair = `${edge.from}>${edge.to}`;
    if (joined.has(pair)) problems.push(`Two arrows go from "${from}" to "${to}". Remove one.`);
    joined.add(pair);
  }

  return problems;
}

/* -------------------------------------------------------------------------- */
/* Editing helpers                                                             */
/* -------------------------------------------------------------------------- */

export function nextNodeId(board: Whiteboard): string {
  const highest = board.nodes.reduce((max, node) => {
    const n = Number(node.id.replace(/^n/, ""));
    return Number.isInteger(n) && n > max ? n : max;
  }, 0);
  return `n${highest + 1}`;
}

/** The first empty grid cell, reading left to right and top to bottom. */
export function firstFreeCell(board: Whiteboard): { col: number; row: number } {
  const taken = new Set(board.nodes.map((node) => `${node.col}:${node.row}`));
  for (let row = 0; row < WHITEBOARD_LIMITS.rows; row += 1) {
    for (let col = 0; col < WHITEBOARD_LIMITS.cols; col += 1) {
      if (!taken.has(`${col}:${row}`)) return { col, row };
    }
  }
  return { col: 0, row: 0 };
}

export function blankWhiteboard(): Whiteboard {
  return {
    title: "How it fits together",
    caption: "",
    nodes: [{ id: "n1", label: "Client", kind: "box", tone: "ink", col: 0, row: 0 }],
    edges: [],
  };
}

/** A three-tier starting point, since most of the projects here are one. */
export function webAppWhiteboard(): Whiteboard {
  return {
    title: "How it fits together",
    caption: "",
    nodes: [
      { id: "n1", label: "Browser", kind: "box", tone: "ink", col: 0, row: 0 },
      { id: "n2", label: "API server", kind: "box", tone: "ink", col: 1, row: 0 },
      { id: "n3", label: "Database", kind: "store", tone: "ink", col: 2, row: 0 },
    ],
    edges: [
      { from: "n1", to: "n2", label: "HTTPS", dashed: false },
      { from: "n2", to: "n3", label: "queries", dashed: false },
    ],
  };
}

/** Plain-language connections, for screen readers and for the admin list. */
export function describeWhiteboard(board: Whiteboard): string[] {
  const labels = new Map(board.nodes.map((node) => [node.id, node.label]));
  return board.edges
    .filter((edge) => labels.has(edge.from) && labels.has(edge.to))
    .map((edge) => {
      const line = `${labels.get(edge.from)} to ${labels.get(edge.to)}`;
      return edge.label ? `${line}: ${edge.label}` : line;
    });
}

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

export const WHITEBOARD_CELL = { width: 190, height: 124 } as const;
export const WHITEBOARD_LINE_HEIGHT = 20;

const MARGIN = 26;
const FONT_SIZE = 17;
/** Average advance of the marker face at 17px, used to size boxes to text. */
const CHAR_WIDTH = 8.3;
const MAX_CHARS_PER_LINE = 16;
/** Average advance of the marker face at the 14px used for arrow labels. */
const LABEL_CHAR_WIDTH = 7;

export type SketchStroke = {
  d: string;
  tone: WhiteboardTone;
  width: number;
  dashed: boolean;
  /** Drawing order: every stroke of one box or arrow shares a number. */
  order: number;
};

export type SketchLabel = {
  x: number;
  y: number;
  lines: string[];
  tone: WhiteboardTone;
  size: number;
  /** Knock the lines out behind the text, for labels that sit on an arrow. */
  halo: boolean;
  order: number;
};

export type Sketch = {
  /** The viewBox. Its origin moves off 0,0 when an arrow detours past the grid. */
  x: number;
  y: number;
  width: number;
  height: number;
  strokes: SketchStroke[];
  labels: SketchLabel[];
};

/** Greedy word wrap. A single word longer than a line keeps its own line. */
export function wrapLabel(label: string, max = MAX_CHARS_PER_LINE): string[] {
  const lines: string[] = [];
  let current = "";

  for (const word of label.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= max || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 — tiny, fast, and identical on the server and in the browser. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

type Bounds = { cx: number; cy: number; halfWidth: number; halfHeight: number };

/** Where a line from the centre of `box` towards (dx, dy) leaves its edge. */
function exitPoint(box: Bounds, dx: number, dy: number, gap: number) {
  const length = Math.hypot(dx, dy) || 1;
  const tx = dx === 0 ? Infinity : box.halfWidth / Math.abs(dx);
  const ty = dy === 0 ? Infinity : box.halfHeight / Math.abs(dy);
  const t = Math.min(tx, ty);
  return {
    x: box.cx + dx * t + (dx / length) * gap,
    y: box.cy + dy * t + (dy / length) * gap,
  };
}

/**
 * Turn a board into marker strokes.
 *
 * `variant` re-rolls the wobble without moving anything — "sketch again" draws
 * the same diagram with a different hand.
 */
export function sketchWhiteboard(board: Whiteboard, seedKey: string, variant = 0): Sketch {
  const random = seeded(hashSeed(seedKey) + variant * 7919);
  const jitter = (amount: number) => (random() - 0.5) * 2 * amount;

  const cols = Math.max(1, ...board.nodes.map((node) => node.col + 1));
  const rows = Math.max(1, ...board.nodes.map((node) => node.row + 1));

  const strokes: SketchStroke[] = [];
  const labels: SketchLabel[] = [];
  const bounds = new Map<string, Bounds>();

  /** One marker line: slightly bowed, with loose ends. */
  const line = (x1: number, y1: number, x2: number, y2: number, looseness = 2) => {
    const length = Math.hypot(x2 - x1, y2 - y1) || 1;
    const bow = jitter(Math.min(5, length * 0.025));
    const mx = (x1 + x2) / 2 + (-(y2 - y1) / length) * bow;
    const my = (y1 + y2) / 2 + ((x2 - x1) / length) * bow;
    return (
      `M${round(x1 + jitter(looseness))},${round(y1 + jitter(looseness))} ` +
      `Q${round(mx)},${round(my)} ${round(x2 + jitter(looseness))},${round(y2 + jitter(looseness))}`
    );
  };

  board.nodes.forEach((node, order) => {
    const lines = wrapLabel(node.label);
    const textWidth = Math.max(...lines.map((text) => text.length)) * CHAR_WIDTH;
    const width = Math.min(Math.max(textWidth + 32, 78), WHITEBOARD_CELL.width - 16);
    const height = 22 + lines.length * WHITEBOARD_LINE_HEIGHT + (node.kind === "store" ? 14 : 0);

    const cx = MARGIN + node.col * WHITEBOARD_CELL.width + WHITEBOARD_CELL.width / 2 + jitter(4);
    const cy = MARGIN + node.row * WHITEBOARD_CELL.height + WHITEBOARD_CELL.height / 2 + jitter(3);
    const x = cx - width / 2;
    const y = cy - height / 2;
    const tone = node.tone;
    const push = (d: string) => strokes.push({ d, tone, width: 1.7, dashed: false, order });

    if (node.kind === "box") {
      // Two passes with overshooting corners — the way a marker actually closes a box.
      for (let pass = 0; pass < 2; pass += 1) {
        const o = () => 2 + jitter(2.5);
        push(line(x - o(), y, x + width + o(), y));
        push(line(x + width, y - o(), x + width, y + height + o()));
        push(line(x + width + o(), y + height, x - o(), y + height));
        push(line(x, y + height + o(), x, y - o()));
      }
    } else if (node.kind === "store") {
      const rx = width / 2 + jitter(1.5);
      const ry = 7;
      const top = y + ry;
      const bottom = y + height - ry;
      push(
        `M${round(x)},${round(top)} A${round(rx)},${ry} 0 1 1 ${round(x + width)},${round(top)} ` +
          `A${round(rx)},${ry} 0 1 1 ${round(x)},${round(top + jitter(1))}`,
      );
      push(line(x, top, x, bottom, 1));
      push(line(x + width, top, x + width, bottom, 1));
      push(
        `M${round(x)},${round(bottom)} A${round(rx)},${ry} 0 0 0 ${round(x + width)},${round(bottom)}`,
      );
    } else {
      // A note is handwriting with an underline, no box.
      const underline = cy + (lines.length * WHITEBOARD_LINE_HEIGHT) / 2 + 3;
      push(line(cx - textWidth / 2 - 4, underline, cx + textWidth / 2 + 4, underline, 1.5));
    }

    labels.push({
      x: round(cx),
      y: round(
        cy - ((lines.length - 1) * WHITEBOARD_LINE_HEIGHT) / 2 + (node.kind === "store" ? 6 : 0),
      ),
      lines,
      tone,
      size: node.kind === "note" ? FONT_SIZE - 1 : FONT_SIZE,
      halo: false,
      order,
    });

    bounds.set(node.id, {
      cx,
      cy,
      halfWidth: node.kind === "note" ? textWidth / 2 + 6 : width / 2,
      halfHeight: height / 2,
    });
  });

  const gridWidth = MARGIN * 2 + cols * WHITEBOARD_CELL.width;
  const gridHeight = MARGIN * 2 + rows * WHITEBOARD_CELL.height;
  const extent = { left: 0, top: 0, right: gridWidth, bottom: gridHeight };

  /**
   * Boxes the straight line from `a` to `b` would pass through, with how far
   * along the line each one sits (0 to 1). Sampling is crude, but the grid is
   * coarse enough that it never misses a box.
   */
  const blockersBetween = (fromId: string, toId: string, a: Bounds, b: Bounds) => {
    const hits: { box: Bounds; t: number }[] = [];
    for (const [id, box] of bounds) {
      if (id === fromId || id === toId) continue;
      for (let i = 1; i < 32; i += 1) {
        const t = i / 32;
        const x = a.cx + (b.cx - a.cx) * t;
        const y = a.cy + (b.cy - a.cy) * t;
        if (Math.abs(x - box.cx) < box.halfWidth + 8 && Math.abs(y - box.cy) < box.halfHeight + 8) {
          hits.push({ box, t });
          break;
        }
      }
    }
    return hits;
  };

  board.edges.forEach((edge, index) => {
    const a = bounds.get(edge.from);
    const b = bounds.get(edge.to);
    if (!a || !b || edge.from === edge.to) return;

    const order = board.nodes.length + index;
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const span = Math.hypot(dx, dy) || 1;

    // The side labels sit on and detours take: above a horizontal arrow, to
    // the right of a vertical one.
    let nx = -dy / span;
    let ny = dx / span;
    if (ny > 0 || (ny === 0 && nx < 0)) {
      nx = -nx;
      ny = -ny;
    }

    // An arrow that would cut through another box bows around it instead. A
    // quadratic curve is displaced 2t(1-t) of its control offset at t, so the
    // offset is sized to clear the far side of the worst box where it passes.
    // Both sides are tried, because bowing over one row can run straight into
    // the row above. Crossing a box costs far more than crossing another arrow,
    // and the side with the lower cost wins.
    const blockers = blockersBetween(edge.from, edge.to, a, b);
    const others = board.edges.flatMap((other) => {
      if (other === edge) return [];
      const p = bounds.get(other.from);
      const q = bounds.get(other.to);
      return p && q ? [[p, q] as const] : [];
    });
    const nearSegment = (x: number, y: number, p: Bounds, q: Bounds) => {
      const vx = q.cx - p.cx;
      const vy = q.cy - p.cy;
      const t = Math.max(
        0,
        Math.min(1, ((x - p.cx) * vx + (y - p.cy) * vy) / (vx * vx + vy * vy || 1)),
      );
      return Math.hypot(x - (p.cx + vx * t), y - (p.cy + vy * t)) < 6;
    };
    const route = (side: 1 | -1) => {
      const sx = nx * side;
      const sy = ny * side;
      let bow = 0;
      for (const { box, t } of blockers) {
        const along = Math.min(0.9, Math.max(0.1, t));
        const offset = (box.cx - a.cx) * sx + (box.cy - a.cy) * sy;
        const reach = Math.abs(sx) * box.halfWidth + Math.abs(sy) * box.halfHeight;
        bow = Math.max(bow, (offset + reach + 16) / (2 * along * (1 - along)));
      }
      bow = Math.min(bow, 220);

      const control = { x: (a.cx + b.cx) / 2 + sx * bow, y: (a.cy + b.cy) / 2 + sy * bow };
      const points = Array.from({ length: 31 }, (_, i) => {
        const t = (i + 1) / 32;
        return {
          t,
          x: (1 - t) ** 2 * a.cx + 2 * t * (1 - t) * control.x + t ** 2 * b.cx,
          y: (1 - t) ** 2 * a.cy + 2 * t * (1 - t) * control.y + t ** 2 * b.cy,
        };
      });

      let cost = 0;
      for (const [id, box] of bounds) {
        if (id === edge.from || id === edge.to) continue;
        const crosses = points.some(
          ({ x, y }) =>
            Math.abs(x - box.cx) < box.halfWidth + 4 && Math.abs(y - box.cy) < box.halfHeight + 4,
        );
        if (crosses) cost += 100;
      }
      // Ignore the ends, where arrows sharing a box legitimately meet.
      for (const [p, q] of others) {
        if (points.some(({ t, x, y }) => t > 0.15 && t < 0.85 && nearSegment(x, y, p, q))) {
          cost += 10;
        }
      }
      return { side, bow, control, cost };
    };

    const above = route(1);
    const below = blockers.length > 0 ? route(-1) : above;
    const chosen = below.cost < above.cost ? below : above;
    const detour = chosen.bow;
    const control = chosen.control;
    nx *= chosen.side;
    ny *= chosen.side;
    // A curved arrow leaves each box heading for its control point.
    const start = detour
      ? exitPoint(a, control.x - a.cx, control.y - a.cy, 7)
      : exitPoint(a, dx, dy, 7);
    const end = detour
      ? exitPoint(b, control.x - b.cx, control.y - b.cy, 9)
      : exitPoint(b, -dx, -dy, 9);

    strokes.push({
      d: detour
        ? `M${round(start.x + jitter(1.2))},${round(start.y + jitter(1.2))} ` +
          `Q${round(control.x + jitter(4))},${round(control.y + jitter(4))} ${round(end.x)},${round(end.y)}`
        : line(start.x, start.y, end.x, end.y, 1.2),
      tone: "blue",
      width: 2,
      dashed: edge.dashed,
      order,
    });

    // The curve's midpoint, which is also where its label rides.
    const midX = detour ? 0.25 * start.x + 0.5 * control.x + 0.25 * end.x : (start.x + end.x) / 2;
    const midY = detour ? 0.25 * start.y + 0.5 * control.y + 0.25 * end.y : (start.y + end.y) / 2;
    if (detour) {
      extent.left = Math.min(extent.left, midX - 30);
      extent.right = Math.max(extent.right, midX + 30);
      extent.top = Math.min(extent.top, midY - 30);
      extent.bottom = Math.max(extent.bottom, midY + 30);
    }

    // The head points along the direction the line arrives from.
    const from = detour ? control : start;
    const angle = Math.atan2(end.y - from.y, end.x - from.x);
    for (const side of [-1, 1]) {
      const hx = end.x - 12 * Math.cos(angle + side * 0.42);
      const hy = end.y - 12 * Math.sin(angle + side * 0.42);
      strokes.push({
        d: line(end.x, end.y, hx, hy, 0.6),
        tone: "blue",
        width: 2,
        dashed: false,
        order,
      });
    }

    if (edge.label) {
      // A label wider than the visible stretch of its arrow would sit on the
      // boxes at either end. Lift it clear of them, over the gap instead. Only
      // arrows running along a row or column need this; a diagonal arrow joins
      // boxes that are already offset from each other.
      const visible = Math.hypot(end.x - start.x, end.y - start.y);
      const reach = (box: Bounds) => Math.abs(nx) * box.halfWidth + Math.abs(ny) * box.halfHeight;
      const offset =
        !detour &&
        Math.max(Math.abs(nx), Math.abs(ny)) > 0.94 &&
        edge.label.length * LABEL_CHAR_WIDTH + 12 > visible
          ? Math.max(reach(a), reach(b)) + 12
          : 13;
      if (offset > 13) extent.top = Math.min(extent.top, midY + ny * offset - 14);

      labels.push({
        x: round(midX + nx * offset),
        y: round(midY + ny * offset),
        lines: [edge.label],
        tone: "blue",
        size: 14,
        halo: true,
        order,
      });
    }
  });

  return {
    x: round(extent.left),
    y: round(extent.top),
    width: round(extent.right - extent.left),
    height: round(extent.bottom - extent.top),
    strokes,
    labels,
  };
}
