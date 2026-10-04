"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "error";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
};

type ToastInput = {
  title: string;
  description?: string;
  tone?: Tone;
  duration?: number;
};

const ToastContext = React.createContext<{ toast: (input: ToastInput) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const isClient = useIsClient();

  const toast = React.useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, title: input.title, description: input.description, tone: input.tone ?? "default" }]);
    const duration = input.duration ?? (input.tone === "error" ? 6000 : 3500);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), duration);
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const icons: Record<Tone, React.ReactNode> = {
    default: <Info className="size-4 text-[var(--accent)]" />,
    success: <CheckCircle2 className="size-4 text-income" />,
    error: <AlertTriangle className="size-4 text-expense" />,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {isClient && toasts.length > 0
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:bottom-auto sm:right-0 sm:top-0 sm:items-end sm:p-4">
              {toasts.map((item) => (
                <div
                  key={item.id}
                  role="status"
                  className={cn(
                    "pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-2.5 rounded-[var(--radius-lg)] border border-border bg-card-elevated p-3.5 shadow-[var(--shadow-soft)]",
                  )}
                >
                  <span className="mt-0.5">{icons[item.tone]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => dismiss(item.id)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context.toast;
}
