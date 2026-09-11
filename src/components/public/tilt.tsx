"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tilts its content toward the pointer in 3D.
 *
 * The handler only writes two CSS custom properties (`--px`, `--py`, each
 * -0.5…0.5); the rotation, the glare and any `.tilt-parallax` children are all
 * derived from them in CSS. So a pointer move costs one style write per frame
 * and no React render.
 *
 * Touch input is ignored — there is no hover on a phone, and tilting on tap
 * would fight with scrolling. Reduced motion is honoured in CSS.
 */
export function Tilt({
  children,
  className,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;

    const el = ref.current;
    if (!el) return;

    const { clientX, clientY } = event;
    if (!("tilting" in el.dataset)) el.dataset.tilting = "";

    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--px", ((clientX - rect.left) / rect.width - 0.5).toFixed(3));
      el.style.setProperty("--py", ((clientY - rect.top) / rect.height - 0.5).toFixed(3));
    });
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;

    cancelAnimationFrame(frame.current);
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
    delete el.dataset.tilting;
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("tilt relative", className)}
    >
      {children}
      {glare ? <span aria-hidden className="tilt-glare" /> : null}
    </div>
  );
}
