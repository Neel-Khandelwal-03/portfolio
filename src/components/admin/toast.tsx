"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { AlertIcon, CheckIcon, CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type Tone = "success" | "error";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

export function useToast() {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast must be used inside <ToastProvider>");
  return push;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Tone = "success") => {
    setToasts((current) => [...current, { id: Date.now() + Math.random(), message, tone }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      {/* aria-live so a screen reader announces the result of a save without
          moving focus away from the form. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.tone === "error" ? 7000 : 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-raised",
        toast.tone === "success"
          ? "border-border-base bg-success-soft text-fg"
          : "border-border-base bg-danger-soft text-fg",
      )}
    >
      {toast.tone === "success" ? (
        <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-success" />
      ) : (
        <AlertIcon width={16} height={16} className="mt-0.5 shrink-0 text-danger" />
      )}
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 shrink-0 rounded p-0.5 text-fg-subtle hover:text-fg"
      >
        <CloseIcon width={14} height={14} />
      </button>
    </div>
  );
}
