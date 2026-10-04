import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-[var(--radius-md)] border border-border bg-[var(--input)] px-3 text-sm text-foreground",
        "placeholder:text-muted-foreground/70 transition-colors",
        "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25",
        "disabled:opacity-50",
        className,
      )}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full resize-none rounded-[var(--radius-md)] border border-border bg-[var(--input)] px-3 py-2.5 text-sm text-foreground",
        "placeholder:text-muted-foreground/70 transition-colors",
        "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25",
        "disabled:opacity-50",
        className,
      )}
    />
  );
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(
        "h-11 w-full appearance-none rounded-[var(--radius-md)] border border-border bg-[var(--input)] px-3 text-sm text-foreground",
        "bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
        "[background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2396967f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25",
        "disabled:opacity-50",
        className,
      )}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      {...props}
      className={cn("mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground", className)}
    />
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-expense">{children}</p>;
}
