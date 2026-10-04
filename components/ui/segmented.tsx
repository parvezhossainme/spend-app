"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  tone?: "default" | "income" | "expense";
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const activeTone: Record<string, string> = {
    default: "bg-card-elevated text-foreground",
    income: "bg-[var(--income)]/20 text-income",
    expense: "bg-[var(--expense)]/20 text-expense",
  };

  return (
    <div
      role="tablist"
      className={cn("flex w-full gap-1 rounded-[var(--radius-md)] border border-border bg-[var(--input)] p-1", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded-[var(--radius-sm)] font-medium transition-colors",
              size === "sm" ? "h-9 text-xs" : "h-10 text-sm",
              active
                ? activeTone[option.tone ?? "default"]
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
