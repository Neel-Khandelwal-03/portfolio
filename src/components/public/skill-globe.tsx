"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";

type Point = { x: number; y: number; z: number };

/** Initial tilt, so the first frame shows a sphere rather than a flat column. */
const TILT = 0.38;

/**
 * Spreads `n` points evenly over a unit sphere (a Fibonacci lattice), then
 * tilts it slightly. Deterministic, so the server and the client produce the
 * same first frame and hydration does not flicker.
 */
function sphere(n: number): Point[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const cos = Math.cos(TILT);
  const sin = Math.sin(TILT);

  return Array.from({ length: n }, (_, i) => {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    return { x, y: y * cos - z * sin, z: y * sin + z * cos };
  });
}

function vars(p: Point): CSSProperties {
  return {
    "--x": p.x.toFixed(3),
    "--y": p.y.toFixed(3),
    "--z": p.z.toFixed(3),
  } as CSSProperties;
}

/**
 * The skills from the CMS, orbiting as a draggable 3D sphere.
 *
 * Positions live in three CSS custom properties per tag; the projection,
 * depth scaling, fade and front-facing accent are all computed in CSS from
 * those. The loop only rotates points and writes numbers.
 *
 * It is decorative — the same skills are listed as text right beside it — so
 * the whole thing is hidden from assistive technology. It stops animating
 * whenever it is off screen or the tab is hidden, and never auto-rotates under
 * `prefers-reduced-motion` (dragging still works, because that motion is the
 * user's own).
 */
export function SkillGlobe({ skills }: { skills: string[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const initial = useMemo(() => sphere(skills.length), [skills.length]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;

    const tags = Array.from(el.querySelectorAll<HTMLElement>("[data-tag]"));
    const points = initial.map((p) => ({ ...p }));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cruiseY = reduced ? 0 : 0.0032;
    const cruiseX = reduced ? 0 : 0.0011;
    let velocityY = cruiseY;
    let velocityX = cruiseX;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let frame = 0;
    let onScreen = false;

    function rotate(angleY: number, angleX: number) {
      const cy = Math.cos(angleY);
      const sy = Math.sin(angleY);
      const cx = Math.cos(angleX);
      const sx = Math.sin(angleX);

      for (const p of points) {
        const x = p.x * cy - p.z * sy;
        let z = p.x * sy + p.z * cy;
        const y = p.y * cx - z * sx;
        z = p.y * sx + z * cx;
        // Renormalise so rounding error cannot slowly shrink or grow the sphere.
        const length = Math.hypot(x, y, z) || 1;
        p.x = x / length;
        p.y = y / length;
        p.z = z / length;
      }
    }

    function paint() {
      for (let i = 0; i < tags.length; i += 1) {
        const p = points[i];
        const style = tags[i].style;
        style.setProperty("--x", p.x.toFixed(3));
        style.setProperty("--y", p.y.toFixed(3));
        style.setProperty("--z", p.z.toFixed(3));
      }
    }

    function tick() {
      rotate(velocityY, velocityX);
      paint();

      if (!dragging) {
        // Ease back to the cruise speed after a flick.
        velocityY += (cruiseY - velocityY) * 0.03;
        velocityX += (cruiseX - velocityX) * 0.03;
      }

      const settled =
        reduced && !dragging && Math.abs(velocityY) < 0.0001 && Math.abs(velocityX) < 0.0001;
      frame = settled ? 0 : requestAnimationFrame(tick);
    }

    function start() {
      if (!frame && onScreen && !document.hidden) frame = requestAnimationFrame(tick);
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    observer.observe(el);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    function onDown(event: PointerEvent) {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      el!.setPointerCapture(event.pointerId);
      el!.dataset.dragging = "";
      start();
    }

    function onMove(event: PointerEvent) {
      if (!dragging) return;
      velocityY = (event.clientX - lastX) * 0.006;
      // Vertical drags scroll the page on touch (touch-action: pan-y), so only
      // a mouse or pen tips the globe over.
      velocityX = event.pointerType === "touch" ? 0 : (event.clientY - lastY) * 0.006;
      lastX = event.clientX;
      lastY = event.clientY;
    }

    function onUp() {
      dragging = false;
      delete el!.dataset.dragging;
      start();
    }

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [initial]);

  if (skills.length === 0) return null;

  return (
    <div ref={stage} aria-hidden className="globe">
      <span className="globe-ring" />
      <span className="globe-ring globe-ring--equator" />
      {skills.map((skill, index) => (
        <span key={`${skill}-${index}`} data-tag className="globe-tag" style={vars(initial[index])}>
          {skill}
        </span>
      ))}
    </div>
  );
}
