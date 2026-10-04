"use client";

import * as React from "react";
import { ArrowRightLeft, Inbox } from "lucide-react";
import { IconBadge } from "@/components/common/icon-badge";
import { MoneyDisplay } from "@/components/common/money-display";
import { EmptyState } from "@/components/ui/switch";
import { formatDayGroup } from "@/lib/finance/dates";
import type { LedgerItem } from "./types";

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function TransactionList({
  items,
  onSelect,
  onAdd,
}: {
  items: LedgerItem[];
  onSelect: (item: LedgerItem) => void;
  onAdd: () => void;
}) {
  const groups = React.useMemo(() => {
    const map = new Map<string, LedgerItem[]>();
    for (const item of items) {
      const key = dayKey(item.date);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="px-3 sm:px-4 lg:px-6">
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="No transactions this month"
          description="Add your first income, expense or transfer to see it here."
          action={
            <button
              type="button"
              onClick={onAdd}
              className="rounded-[var(--radius-md)] border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-[var(--accent)]"
            >
              + Add transaction
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-3 sm:px-4 lg:px-6">
      {groups.map(([key, groupItems]) => (
        <section key={key} aria-label={formatDayGroup(new Date(`${key}T00:00:00.000Z`))}>
          <div className="mb-1 flex items-center gap-3 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {formatDayGroup(new Date(`${key}T00:00:00.000Z`))}
            </h2>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <ul className="divide-y divide-[var(--border)]">
            {groupItems.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                {item.kind === "transaction" ? (
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-1 py-3 text-left transition-colors hover:bg-card/70"
                  >
                    <IconBadge
                      name={item.data.category?.icon ?? "Ellipsis"}
                      color={item.data.category?.color ?? "#96967f"}
                      className="size-10"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.data.category?.name ?? "Uncategorised"}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <span className="truncate">{item.data.account.name}</span>
                        {item.data.note ? <span className="truncate">· “{item.data.note}”</span> : null}
                      </p>
                    </div>
                    <MoneyDisplay
                      value={item.data.amount}
                      currency={item.data.currencyCode}
                      tone={item.data.type === "income" ? "income" : "expense"}
                      className="shrink-0 text-sm font-semibold"
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-1 py-3 text-left transition-colors hover:bg-card/70"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                      <ArrowRightLeft className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.data.fromAccount.name} → {item.data.toAccount.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        Transfer{item.data.note ? ` · “${item.data.note}”` : ""}
                      </p>
                    </div>
                    <MoneyDisplay
                      value={item.data.fromAmount}
                      currency={item.data.fromCurrency}
                      tone="muted"
                      className="shrink-0 text-sm font-semibold"
                    />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
