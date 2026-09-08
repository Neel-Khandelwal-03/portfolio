"use client";

import type { AnchorHTMLAttributes } from "react";

import { track } from "@/lib/analytics";

/**
 * An anchor that reports a first-party analytics event when clicked.
 *
 * The beacon is fire-and-forget, so navigation is never delayed waiting on it.
 */
export function TrackedLink({
  event,
  detail,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { event: string; detail?: string }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        track(event, detail);
        onClick?.(e);
      }}
    />
  );
}
