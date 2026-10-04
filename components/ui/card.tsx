import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[var(--radius-xl)] border border-border bg-card shadow-[var(--shadow-soft)]",
        className,
      )}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div {...props} className={cn("flex flex-col gap-1 px-5 pt-5", className)} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 {...props} className={cn("text-base font-semibold tracking-tight", className)} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p {...props} className={cn("text-sm text-muted-foreground", className)} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div {...props} className={cn("p-5", className)} />;
}

export function Separator({ className, ...props }: React.ComponentProps<"div">) {
  return <div {...props} role="separator" className={cn("h-px w-full bg-[var(--border)]", className)} />;
}

export function Badge({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"span"> & { tone?: "default" | "income" | "expense" | "warning" | "muted" }) {
  const tones = {
    default: "bg-card-elevated text-foreground",
    income: "bg-[var(--income)]/15 text-income",
    expense: "bg-[var(--expense)]/15 text-expense",
    warning: "bg-[var(--warning)]/15 text-warning",
    muted: "bg-card-elevated text-muted-foreground",
  } as const;
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    />
  );
}

export function Progress({
  value,
  className,
  tone = "accent",
}: {
  value: number;
  className?: string;
  tone?: "accent" | "income" | "expense" | "warning";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const colors = {
    accent: "bg-[var(--accent)]",
    income: "bg-income",
    expense: "bg-expense",
    warning: "bg-warning",
  } as const;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--input)]", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", colors[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div {...props} className={cn("animate-pulse rounded-[var(--radius-md)] bg-card-elevated", className)} />;
}
