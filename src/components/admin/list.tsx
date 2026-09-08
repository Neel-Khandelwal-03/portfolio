"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useToast } from "@/components/admin/toast";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/ui/icons";
import type { ActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Delete with confirmation                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Destructive action guarded by a modal confirmation naming the record.
 *
 * The dialog traps Escape, restores focus to the trigger on close, and the
 * confirm button is the only way through — a mis-click cannot delete anything.
 */
export function DeleteButton({
  id,
  label,
  entity,
  action,
  compact = false,
}: {
  id: number;
  /** The record's name, shown in the confirmation so it is unambiguous. */
  label: string;
  entity: string;
  action: (id: number) => Promise<ActionState>;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Captured now: by cleanup time the ref may point elsewhere, and focus must
    // return to the button that opened the dialog.
    const trigger = triggerRef.current;

    confirmRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  function confirm() {
    startTransition(async () => {
      const result = await action(id);
      setOpen(false);

      if (result.status === "success") {
        toast(result.message ?? `${entity} deleted.`, "success");
      } else {
        toast(result.message ?? "Could not delete. Please try again.", "error");
      }
    });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${label}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-fg-subtle transition-colors duration-150 hover:bg-danger-soft hover:text-danger",
          compact ? "h-8 w-8 justify-center" : "h-8 px-2.5",
        )}
      >
        <TrashIcon width={14} height={14} />
        {compact ? null : "Delete"}
      </button>

      {open ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`del-${id}-title`}
          aria-describedby={`del-${id}-desc`}
          className="fixed inset-0 z-[70] grid place-items-center p-4"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cancel"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/50"
          />
          <div className="relative w-full max-w-md rounded-xl border border-border-base bg-bg-raised p-6 shadow-raised">
            <h2 id={`del-${id}-title`} className="text-base font-semibold">
              Delete this {entity.toLowerCase()}?
            </h2>
            <p id={`del-${id}-desc`} className="mt-2 text-sm text-fg-muted">
              Are you sure you want to delete{" "}
              <span className="font-medium text-fg">{label}</span>? This cannot be undone, and it
              will disappear from the public site.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="inline-flex h-10 items-center rounded-lg border border-border-base px-4 text-sm font-medium hover:bg-bg-subtle disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={confirm}
                disabled={pending}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-danger px-4 text-sm font-medium text-white hover:bg-danger-hover disabled:opacity-60"
              >
                {pending ? <SpinnerIcon width={15} height={15} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Ordering                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Move-up / move-down controls.
 *
 * Chosen over drag-and-drop deliberately: two buttons are keyboard-operable,
 * work on touch without a gesture library, are announced correctly by screen
 * readers, and add no dependency. The resulting `display_order` is what the
 * public site sorts by.
 */
export function OrderControls({
  id,
  label,
  isFirst,
  isLast,
  action,
}: {
  id: number;
  label: string;
  isFirst: boolean;
  isLast: boolean;
  action: (id: number, direction: "up" | "down") => Promise<ActionState>;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await action(id, direction);
      if (result.status === "error") {
        toast(result.message ?? "Could not reorder.", "error");
      }
    });
  }

  const button =
    "grid h-7 w-7 place-items-center rounded-md border border-border-base text-fg-subtle " +
    "transition-colors duration-150 hover:text-fg disabled:opacity-35 disabled:hover:text-fg-subtle";

  return (
    <div className="flex items-center gap-1" aria-label={`Reorder ${label}`}>
      <button
        type="button"
        onClick={() => move("up")}
        disabled={isFirst || pending}
        aria-label={`Move ${label} up`}
        className={button}
      >
        <ChevronUpIcon width={14} height={14} />
      </button>
      <button
        type="button"
        onClick={() => move("down")}
        disabled={isLast || pending}
        aria-label={`Move ${label} down`}
        className={button}
      >
        <ChevronDownIcon width={14} height={14} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Row shell                                                                   */
/* -------------------------------------------------------------------------- */

export function AdminRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-border-base bg-bg-raised p-4",
        className,
      )}
    >
      {children}
    </li>
  );
}
