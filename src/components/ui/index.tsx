import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap " +
  "transition-[background-color,border-color,color,opacity] duration-150 " +
  "disabled:pointer-events-none disabled:opacity-55";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary:
    "border border-border-base bg-bg-raised text-fg hover:border-border-strong hover:bg-bg-subtle",
  ghost: "text-fg-muted hover:bg-bg-subtle hover:text-fg",
  danger: "bg-danger text-white hover:bg-danger-hover",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-base bg-bg-raised shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentPropsWithoutRef<"span"> & { tone?: "neutral" | "accent" | "success" | "warning" }) {
  const tones = {
    neutral: "border-border-base bg-bg-subtle text-fg-muted",
    accent: "border-transparent bg-accent-soft text-accent",
    success: "border-transparent bg-success-soft text-success",
    warning: "border-transparent bg-warning-soft text-warning",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Small monospace chip used for technology lists. */
export function TechChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-border-base bg-bg-subtle px-2 py-1 font-mono text-[11px] leading-none text-fg-muted">
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export function Container({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mx-auto w-full max-w-5xl px-5 sm:px-6", className)} {...props} />;
}

/**
 * A portfolio section.
 *
 * `content-auto` lets the browser skip layout and paint for sections still far
 * below the fold, which is most of the page on a phone.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  as: Tag = "section",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn("content-auto scroll-mt-24 border-t border-border-base py-16 sm:py-20", className)}
    >
      <Container>
        <div className="reveal">
          {eyebrow ? (
            <p className="mb-3 font-mono text-[11px] font-medium tracking-[0.16em] text-accent uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2 id={`${id}-heading`} className="text-2xl font-semibold sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
              {description}
            </p>
          ) : null}
        </div>
        <div className="mt-10">{children}</div>
      </Container>
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-bg-subtle px-6 py-12 text-center">
      <p className="text-sm font-medium text-fg">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm text-fg-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Skeleton block used inside Suspense fallbacks. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-border-base/70", className)}
    />
  );
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="border-t border-border-base py-16 sm:py-20">
      <Container>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-8 w-56" />
        <div className="mt-10 space-y-4">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </Container>
      <span className="sr-only">Loading section</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Prose                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Renders stored plain text as paragraphs. Text is rendered as text — never as
 * HTML — so admin content can never introduce script into the public page.
 */
export function Prose({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <div className={cn("space-y-4 text-[15px] leading-relaxed text-fg-muted", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
