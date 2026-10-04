"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { toQueryString } from "@/lib/query";
import { cn } from "@/lib/utils";

export function MonthSelector({
  monthLabel,
  previousMonthParam,
  nextMonthParam,
  isCurrent,
  query,
}: {
  monthLabel: string;
  previousMonthParam: string;
  nextMonthParam: string;
  isCurrent: boolean;
  query: Record<string, string>;
}) {
  const href = (month?: string) => {
    const params = { ...query };
    delete params.month;
    delete params.tx;
    return `/records${toQueryString(month ? { ...params, month } : params)}`;
  };

  const buttonClass =
    "grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground";

  return (
    <div className="flex items-center justify-center gap-1 px-3 pb-3 sm:px-4 lg:px-6">
      <Link href={href(previousMonthParam)} aria-label="Previous month" className={buttonClass}>
        <ChevronLeft className="size-5" />
      </Link>

      <div className="flex min-w-[168px] items-center justify-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium tracking-tight">{monthLabel}</span>
        {!isCurrent ? (
          <Link
            href={href()}
            className={cn(
              "inline-flex h-8 items-center rounded-full border border-border px-2.5 text-xs font-medium text-muted-foreground",
              "transition-colors hover:text-[var(--accent)]",
            )}
          >
            Today
          </Link>
        ) : null}
      </div>

      <Link href={href(nextMonthParam)} aria-label="Next month" className={buttonClass}>
        <ChevronRight className="size-5" />
      </Link>
    </div>
  );
}
