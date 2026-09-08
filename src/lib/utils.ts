/** Joins class names, dropping falsy values. Small enough not to need `clsx`. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats a `YYYY-MM-DD` column as "Mon YYYY".
 *
 * The string is parsed by hand rather than with `new Date()`, which would treat
 * a bare date as UTC midnight and shift it a day backwards west of Greenwich.
 */
export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return "";
  const [year, month] = value.split("-");
  const index = Number(month) - 1;
  if (!year || Number.isNaN(index) || index < 0 || index > 11) return value;
  return `${MONTHS[index]} ${year}`;
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  presentLabel = "Present",
): string {
  const from = formatMonthYear(start);
  const to = end ? formatMonthYear(end) : presentLabel;
  if (!from && !end) return "";
  if (!from) return to;
  return `${from} — ${to}`;
}

export function formatFullDate(value: string | null | undefined): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  const index = Number(month) - 1;
  if (!year || Number.isNaN(index) || index < 0 || index > 11) return value;
  return `${Number(day)} ${MONTHS[index]} ${year}`;
}

export function formatTimestamp(value: Date | string | null | undefined): string {
  if (!value) return "Never";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** First letter of the first two words, for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Renders stored plain text as paragraphs.
 *
 * Content is never injected as HTML — the admin writes plain text and the UI
 * splits it on blank lines, so a pasted `<script>` can only ever be text.
 */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Allows only http(s), mailto and site-relative URLs.
 *
 * Stops a stored `javascript:` URL from becoming a click-to-execute link if a
 * value ever reaches the database from outside the validated admin forms.
 */
export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
  return null;
}
