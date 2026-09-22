"use client";

import { useState } from "react";

import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { WhiteboardSketch } from "@/components/whiteboard/whiteboard-sketch";
import { cn } from "@/lib/utils";
import {
  WHITEBOARD_KINDS,
  WHITEBOARD_LIMITS,
  WHITEBOARD_TONES,
  blankWhiteboard,
  firstFreeCell,
  nextNodeId,
  webAppWhiteboard,
  whiteboardProblems,
  type WhiteboardKind,
  type WhiteboardTone,
} from "@/lib/whiteboard";
import type { Whiteboard, WhiteboardEdge, WhiteboardNode } from "@/db/schema";

const INPUT =
  "border-border-base bg-bg text-fg focus:border-accent rounded-md border px-2.5 py-1.5 text-[13px] focus:outline-none";
const BUTTON =
  "border-border-base bg-bg hover:border-border-strong hover:bg-bg-subtle inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium";
const REMOVE =
  "text-danger hover:bg-danger-soft inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium";

const KIND_LABEL: Record<WhiteboardKind, string> = { box: "Box", store: "Database", note: "Note" };
const TONE_LABEL: Record<WhiteboardTone, string> = {
  ink: "Black",
  blue: "Blue",
  red: "Red",
  green: "Green",
};

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

/** The first ordered pair of boxes not already joined, for a new arrow to start on. */
function unjoinedPair(board: Whiteboard): [string, string] | null {
  const joined = new Set(board.edges.map((edge) => `${edge.from}>${edge.to}`));
  for (const a of board.nodes) {
    for (const b of board.nodes) {
      if (a.id !== b.id && !joined.has(`${a.id}>${b.id}`)) return [a.id, b.id];
    }
  }
  return null;
}

/**
 * The whiteboard editor on the project form.
 *
 * The whole board travels as one hidden JSON input, like screenshots and
 * metrics, so it is validated by the same server schema as every other field
 * and nothing is written until the project is saved. That includes removal:
 * "Remove whiteboard" only empties the field, and it can be undone until then.
 */
export function WhiteboardField({
  defaultValue,
  seedKey,
  error,
}: {
  defaultValue: Whiteboard | null;
  seedKey: string;
  error?: string;
}) {
  const [board, setBoard] = useState<Whiteboard | null>(defaultValue);
  const [removed, setRemoved] = useState<Whiteboard | null>(null);

  if (!board) {
    return (
      <div>
        <input type="hidden" name="whiteboard" value="" />
        <div className="border-border-base rounded-lg border border-dashed p-5">
          {removed ? (
            <>
              <p className="text-[13px] font-medium">Whiteboard removed</p>
              <p className="text-fg-subtle mt-1 text-[13px]">
                Save the project to take it off the case study.
              </p>
              <button
                type="button"
                className={cn(BUTTON, "mt-3")}
                onClick={() => {
                  setBoard(removed);
                  setRemoved(null);
                }}
              >
                Undo
              </button>
            </>
          ) : (
            <>
              <p className="text-[13px] font-medium">No whiteboard</p>
              <p className="text-fg-subtle mt-1 text-[13px]">
                Sketch how this project fits together. Visitors open it from the case study.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={BUTTON}
                  onClick={() => setBoard(webAppWhiteboard())}
                >
                  <PlusIcon width={14} height={14} />
                  Start from a web-app sketch
                </button>
                <button
                  type="button"
                  className={BUTTON}
                  onClick={() => setBoard(blankWhiteboard())}
                >
                  Start blank
                </button>
              </div>
            </>
          )}
        </div>
        {error ? <p className="text-danger mt-1.5 text-[13px]">{error}</p> : null}
      </div>
    );
  }

  const update = (change: (current: Whiteboard) => Whiteboard) =>
    setBoard((current) => (current ? change(current) : current));

  const updateNode = (id: string, patch: Partial<WhiteboardNode>) =>
    update((b) => ({
      ...b,
      nodes: b.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    }));

  const updateEdge = (index: number, patch: Partial<WhiteboardEdge>) =>
    update((b) => ({
      ...b,
      edges: b.edges.map((edge, i) => (i === index ? { ...edge, ...patch } : edge)),
    }));

  // Problems the save would reject, shown while editing rather than after.
  const problems = [
    ...(board.title.trim() ? [] : ["Give the whiteboard a title."]),
    ...(board.nodes.some((node) => !node.label.trim()) ? ["Every box needs a label."] : []),
    ...whiteboardProblems(board),
  ];
  const canAddArrow = board.edges.length < WHITEBOARD_LIMITS.edges && unjoinedPair(board) !== null;

  return (
    <div className="space-y-6">
      <input type="hidden" name="whiteboard" value={JSON.stringify(board)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Title</span>
          <input
            className={cn(INPUT, "w-full")}
            value={board.title}
            maxLength={WHITEBOARD_LIMITS.title}
            onChange={(event) => update((b) => ({ ...b, title: event.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Caption</span>
          <input
            className={cn(INPUT, "w-full")}
            value={board.caption}
            maxLength={WHITEBOARD_LIMITS.caption}
            placeholder="What the diagram shows, in one line"
            onChange={(event) => update((b) => ({ ...b, caption: event.target.value }))}
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 flex w-full items-baseline justify-between text-[13px] font-medium">
          Boxes
          <span className="text-fg-subtle font-normal tabular-nums">
            {board.nodes.length} of {WHITEBOARD_LIMITS.nodes}
          </span>
        </legend>
        <ul className="space-y-2">
          {board.nodes.map((node, index) => (
            <li key={node.id} className="flex flex-wrap items-center gap-2">
              <input
                aria-label={`Box ${index + 1} label`}
                className={cn(INPUT, "min-w-0 flex-1 basis-40")}
                value={node.label}
                maxLength={WHITEBOARD_LIMITS.label}
                onChange={(event) => updateNode(node.id, { label: event.target.value })}
              />
              <select
                aria-label={`Box ${index + 1} shape`}
                className={INPUT}
                value={node.kind}
                onChange={(event) =>
                  updateNode(node.id, { kind: event.target.value as WhiteboardKind })
                }
              >
                {WHITEBOARD_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABEL[kind]}
                  </option>
                ))}
              </select>
              <select
                aria-label={`Box ${index + 1} colour`}
                className={INPUT}
                value={node.tone}
                onChange={(event) =>
                  updateNode(node.id, { tone: event.target.value as WhiteboardTone })
                }
              >
                {WHITEBOARD_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {TONE_LABEL[tone]}
                  </option>
                ))}
              </select>
              <label className="text-fg-subtle flex items-center gap-1.5 text-[12px]">
                Col
                <input
                  type="number"
                  min={1}
                  max={WHITEBOARD_LIMITS.cols}
                  className={cn(INPUT, "w-16 tabular-nums")}
                  value={node.col + 1}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value)) {
                      updateNode(node.id, { col: clamp(value - 1, WHITEBOARD_LIMITS.cols - 1) });
                    }
                  }}
                />
              </label>
              <label className="text-fg-subtle flex items-center gap-1.5 text-[12px]">
                Row
                <input
                  type="number"
                  min={1}
                  max={WHITEBOARD_LIMITS.rows}
                  className={cn(INPUT, "w-16 tabular-nums")}
                  value={node.row + 1}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value)) {
                      updateNode(node.id, { row: clamp(value - 1, WHITEBOARD_LIMITS.rows - 1) });
                    }
                  }}
                />
              </label>
              <button
                type="button"
                aria-label={`Remove ${node.label.trim() || `box ${index + 1}`}`}
                className={REMOVE}
                onClick={() =>
                  update((b) => ({
                    ...b,
                    nodes: b.nodes.filter((n) => n.id !== node.id),
                    edges: b.edges.filter((e) => e.from !== node.id && e.to !== node.id),
                  }))
                }
              >
                <TrashIcon width={14} height={14} />
              </button>
            </li>
          ))}
        </ul>
        {board.nodes.length < WHITEBOARD_LIMITS.nodes ? (
          <button
            type="button"
            className={cn(BUTTON, "mt-3")}
            onClick={() =>
              update((b) => ({
                ...b,
                nodes: [
                  ...b.nodes,
                  {
                    id: nextNodeId(b),
                    label: "New box",
                    kind: "box",
                    tone: "ink",
                    ...firstFreeCell(b),
                  },
                ],
              }))
            }
          >
            <PlusIcon width={14} height={14} />
            Add box
          </button>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="mb-2 flex w-full items-baseline justify-between text-[13px] font-medium">
          Arrows
          <span className="text-fg-subtle font-normal tabular-nums">
            {board.edges.length} of {WHITEBOARD_LIMITS.edges}
          </span>
        </legend>
        {board.edges.length > 0 ? (
          <ul className="space-y-2">
            {board.edges.map((edge, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Arrow ${index + 1} starts at`}
                  className={cn(INPUT, "max-w-44")}
                  value={edge.from}
                  onChange={(event) => updateEdge(index, { from: event.target.value })}
                >
                  {board.nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.label || "Untitled box"}
                    </option>
                  ))}
                </select>
                <span aria-hidden className="text-fg-subtle">
                  →
                </span>
                <select
                  aria-label={`Arrow ${index + 1} ends at`}
                  className={cn(INPUT, "max-w-44")}
                  value={edge.to}
                  onChange={(event) => updateEdge(index, { to: event.target.value })}
                >
                  {board.nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.label || "Untitled box"}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`Arrow ${index + 1} label`}
                  className={cn(INPUT, "min-w-0 flex-1 basis-32")}
                  value={edge.label}
                  maxLength={WHITEBOARD_LIMITS.edgeLabel}
                  placeholder="Label (optional)"
                  onChange={(event) => updateEdge(index, { label: event.target.value })}
                />
                <label className="text-fg-muted flex items-center gap-1.5 text-[12px]">
                  <input
                    type="checkbox"
                    checked={edge.dashed}
                    onChange={(event) => updateEdge(index, { dashed: event.target.checked })}
                  />
                  Dashed
                </label>
                <button
                  type="button"
                  aria-label={`Remove arrow ${index + 1}`}
                  className={REMOVE}
                  onClick={() =>
                    update((b) => ({ ...b, edges: b.edges.filter((_, i) => i !== index) }))
                  }
                >
                  <TrashIcon width={14} height={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {board.nodes.length < 2 ? (
          <p className="text-fg-subtle text-[13px]">Add a second box to draw an arrow.</p>
        ) : canAddArrow ? (
          <button
            type="button"
            className={cn(BUTTON, board.edges.length > 0 && "mt-3")}
            onClick={() =>
              update((b) => {
                const pair = unjoinedPair(b);
                return pair
                  ? {
                      ...b,
                      edges: [...b.edges, { from: pair[0], to: pair[1], label: "", dashed: false }],
                    }
                  : b;
              })
            }
          >
            <PlusIcon width={14} height={14} />
            Add arrow
          </button>
        ) : null}
      </fieldset>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <span className="text-[13px] font-medium">Preview</span>
          <span className="text-fg-subtle text-[12px]">Exactly what visitors see</span>
        </div>
        <div className="whiteboard-surface overflow-x-auto rounded-lg">
          <WhiteboardSketch
            board={board}
            seedKey={seedKey}
            className="block h-auto w-full min-w-[520px]"
          />
        </div>
      </div>

      {problems.length > 0 ? (
        <ul role="status" className="text-danger space-y-1 text-[13px]">
          {problems.map((problem, index) => (
            <li key={index}>{problem}</li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-danger text-[13px]">{error}</p> : null}

      <div className="border-border-base flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-fg-subtle text-[13px]">
          Columns run left to right, rows top to bottom. Changes save with the project.
        </p>
        <button
          type="button"
          className={REMOVE}
          onClick={() => {
            setRemoved(board);
            setBoard(null);
          }}
        >
          <TrashIcon width={14} height={14} />
          Remove whiteboard
        </button>
      </div>
    </div>
  );
}
