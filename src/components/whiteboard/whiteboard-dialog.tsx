"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { CloseIcon } from "@/components/ui/icons";
import { WhiteboardSketch } from "@/components/whiteboard/whiteboard-sketch";
import { track } from "@/lib/analytics";
import { describeWhiteboard } from "@/lib/whiteboard";
import type { Whiteboard } from "@/db/schema";

/**
 * The full-size whiteboard viewer on a case study.
 *
 * A native `<dialog>` opened with `showModal()`: the browser supplies the focus
 * trap, Escape to close, the inert page behind it and focus restoration, which
 * a hand-rolled overlay would have to reimplement and would get subtly wrong.
 *
 * Several buttons on the page can open the same dialog, and they live in
 * different parts of a server-rendered tree, so they signal it with a window
 * event rather than sharing React state.
 */

export const WHITEBOARD_DIALOG_ID = "whiteboard-dialog";
const OPEN_EVENT = "whiteboard:open";

/** Milliseconds between one box (or arrow) and the next. */
const STEP_MS = 115;

/**
 * Draw every stroke in, in the order a person would: boxes, then arrows, each
 * label appearing just after its box. Strokes rest in their finished state, so
 * with reduced motion — or before this runs — the diagram is simply there.
 */
function drawIn(root: Element) {
  for (const animation of root.getAnimations({ subtree: true })) animation.cancel();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const strokesPerStep = new Map<number, number>();

  root.querySelectorAll<SVGPathElement>("path[data-stroke]").forEach((path) => {
    const order = Number(path.dataset.order);
    const nth = strokesPerStep.get(order) ?? 0;
    strokesPerStep.set(order, nth + 1);
    const delay = order * STEP_MS + nth * 26;

    // A dash pattern cannot also be used to reveal the line, so dashed arrows fade.
    if (path.hasAttribute("data-dashed")) {
      path.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 280,
        delay,
        fill: "backwards",
        easing: "ease-out",
      });
      return;
    }

    const length = `${path.getTotalLength()}px`;
    path.animate(
      [
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDasharray: length, strokeDashoffset: "0px" },
      ],
      { duration: 320, delay, fill: "backwards", easing: "cubic-bezier(0.3, 0.7, 0.3, 1)" },
    );
  });

  root.querySelectorAll<SVGTextElement>("text[data-label]").forEach((label) => {
    label.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 260,
      delay: Number(label.dataset.order) * STEP_MS + 170,
      fill: "backwards",
      easing: "ease-out",
    });
  });
}

export function WhiteboardOpenButton({
  target = WHITEBOARD_DIALOG_ID,
  className,
  children,
}: {
  target?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: target }))}
    >
      {children}
    </button>
  );
}

export function WhiteboardDialog({
  id = WHITEBOARD_DIALOG_ID,
  board,
  seedKey,
}: {
  id?: string;
  board: Whiteboard;
  seedKey: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState(0);

  const titleId = `${id}-title`;
  const connections = describeWhiteboard(board);

  useEffect(() => {
    function open(event: Event) {
      if ((event as CustomEvent<string>).detail !== id) return;

      const element = dialog.current;
      if (!element || element.open) return;

      element.showModal();
      track("project_whiteboard", seedKey);
      if (surface.current) drawIn(surface.current);
    }

    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [id, seedKey]);

  // "Sketch again" re-renders the strokes with a new hand; draw them in once
  // React has committed the new paths.
  useEffect(() => {
    if (variant > 0 && surface.current && dialog.current?.open) drawIn(surface.current);
  }, [variant]);

  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      id={id}
      aria-labelledby={titleId}
      className="whiteboard-dialog"
      // The panel fills the dialog, so a click that lands on the dialog itself
      // came from the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="flex max-h-[inherit] flex-col gap-5 p-5 sm:p-7">
        <header className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="label text-fg-subtle">Whiteboard</p>
            <h2 id={titleId} className="text-subtitle mt-2 font-semibold">
              {board.title}
            </h2>
            {board.caption ? (
              <p className="text-fg-muted mt-2 max-w-2xl text-[15px] leading-relaxed">
                {board.caption}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close whiteboard"
            className="border-border-base text-fg-muted hover:bg-bg-subtle hover:text-fg grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors duration-200"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </header>

        <div ref={surface} className="whiteboard-surface rounded-card min-h-0 flex-1 overflow-auto">
          <WhiteboardSketch
            board={board}
            seedKey={seedKey}
            variant={variant}
            title={board.title}
            className="block h-auto w-full min-w-[640px]"
          />
        </div>
        {/* Below 640px the board keeps its size and scrolls; shrinking it would make the handwriting unreadable. */}
        <p className="text-fg-subtle -mt-2 text-[12px] sm:hidden">
          Swipe sideways to see the whole board.
        </p>

        {connections.length > 0 ? (
          <ul className="sr-only">
            {connections.map((connection, index) => (
              <li key={index}>{connection}</li>
            ))}
          </ul>
        ) : null}

        <footer className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-fg-subtle font-mono text-[12px] tabular-nums">
            {board.nodes.length} {board.nodes.length === 1 ? "box" : "boxes"} · {board.edges.length}{" "}
            {board.edges.length === 1 ? "arrow" : "arrows"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVariant((current) => current + 1)}
              className="border-border-base bg-bg-raised text-fg hover:border-border-strong hover:bg-bg-subtle inline-flex h-10 items-center rounded-full border px-5 text-sm font-medium transition-colors duration-200"
            >
              Sketch again
            </button>
            <button
              type="button"
              onClick={close}
              className="bg-accent text-accent-fg hover:bg-accent-hover inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors duration-200"
            >
              Done
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
