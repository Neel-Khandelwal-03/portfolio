import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover shadow-card hover:shadow-raised",
  secondary:
    "border border-border-base bg-bg-raised text-fg hover:border-border-strong hover:bg-bg-subtle",
  ghost: "text-fg-muted hover:bg-bg-subtle hover:text-fg",
  danger: "bg-danger text-white hover:bg-danger-hover",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
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
      className={cn("border-border-base bg-bg-raised rounded-card border", className)}
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
    <span className="border-border-base bg-bg-subtle text-fg-muted hover:border-border-strong hover:text-fg rounded-md border px-2 py-1 font-mono text-[11px] leading-none transition-colors duration-200">
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export function Container({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)} {...props} />;
}

/**
 * The recurring monospace label: a two-digit index, a slash, and a name.
 *
 * Used for section headers and panel headings so numbering reads as a
 * deliberate system rather than decoration.
 */
export function Eyebrow({
  index,
  children,
  className,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("label text-accent flex items-center gap-2", className)}>
      {index ? (
        <>
          <span className="tabular-nums">{index}</span>
          <span className="bg-accent-line h-px w-6" aria-hidden />
        </>
      ) : null}
      <span className="text-fg-subtle">{children}</span>
    </p>
  );
}

/**
 * A portfolio section.
 *
 * The header is a two-column band on desktop — number and title on the left,
 * supporting copy on the right — which gives every section the same anchor
 * point while leaving the body free to use whatever layout suits its content.
 */
export function Section({
  id,
  index,
  eyebrow,
  title,
  description,
  children,
  className,
  bleed = false,
  as: Tag = "section",
}: {
  id: string;
  index?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Skips the container so the body can run full width. */
  bleed?: boolean;
  as?: ElementType;
}) {
  const header = (
    <div className="reveal grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-12">
      <div>
        <Eyebrow index={index}>{eyebrow}</Eyebrow>
        <h2 id={`${id}-heading`} className="text-title mt-4 font-semibold">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="text-fg-muted text-lead max-w-xl lg:pb-1.5">{description}</p>
      ) : null}
    </div>
  );

  return (
    <Tag
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn("content-auto scroll-mt-28 py-20 sm:py-28", className)}
    >
      <Container>
        {header}
        <div className="border-border-hair mt-8 border-t" aria-hidden />
      </Container>
      {bleed ? (
        <div className="mt-12">{children}</div>
      ) : (
        <Container className="mt-12">{children}</Container>
      )}
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
    <div className="border-border-strong bg-bg-subtle rounded-card border border-dashed px-6 py-12 text-center">
      <p className="text-fg text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-fg-muted mx-auto mt-1.5 max-w-md text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Skeleton block used inside Suspense fallbacks. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("bg-border-base/70 animate-pulse rounded-md", className)} />
  );
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="py-20 sm:py-28">
      <Container>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-9 w-64" />
        <div className="mt-12 space-y-4">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
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
    <div className={cn("text-fg-muted text-lead space-y-5", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
