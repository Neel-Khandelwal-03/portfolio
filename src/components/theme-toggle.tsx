"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "@/components/theme-script";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

/* -------------------------------------------------------------------------- */
/* localStorage as an external store                                           */
/* -------------------------------------------------------------------------- */

/**
 * The stored preference is external state, so it is read with
 * `useSyncExternalStore` rather than copied into React state inside an effect.
 * That keeps hydration correct (the server snapshot is always "system") and
 * avoids the extra render an effect-then-setState pattern would cause.
 */
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  // `storage` fires in *other* tabs, keeping several open tabs in step.
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

/** The server cannot know the preference, so it always renders the neutral one. */
function getServerSnapshot(): Theme {
  return "system";
}

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Three-way theme control.
 *
 * The class is toggled directly on <html>, so switching is a single style
 * recalculation rather than a re-render of the page.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  const select = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private-mode storage failures should not break the toggle.
    }
    apply(next);
    emit();
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "border-border-base bg-bg-subtle inline-flex items-center gap-0.5 rounded-lg border p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => select(value)}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md transition-colors duration-150",
              active ? "bg-bg-raised text-fg shadow-card" : "text-fg-subtle hover:text-fg",
            )}
          >
            <Icon width={14} height={14} />
          </button>
        );
      })}
    </div>
  );
}
