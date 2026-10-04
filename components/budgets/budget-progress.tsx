"use client";

import { Badge, Progress } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/money-display";
import type { BudgetDTO } from "@/lib/services/budgets";

const TONES: Record<BudgetDTO["status"], "income" | "warning" | "expense"> = {
  healthy: "income",
  warning: "warning",
  exceeded: "expense",
};

const LABELS: Record<BudgetDTO["status"], string> = {
  healthy: "Healthy",
  warning: "Warning",
  exceeded: "Exceeded",
};

export function BudgetProgress({ budget }: { budget: BudgetDTO }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm">
          <MoneyDisplay value={budget.spent} currency={budget.currencyCode} className="font-semibold" />
          <span className="text-muted-foreground"> / </span>
          <MoneyDisplay value={budget.amount} currency={budget.currencyCode} tone="muted" className="text-sm" />
        </p>
        <span className="num text-sm font-semibold">{Math.round(budget.percentage)}%</span>
      </div>
      <Progress value={budget.percentage} tone={TONES[budget.status]} className="mt-2" />
      <div className="mt-2 flex items-center justify-between">
        <Badge tone={budget.status === "healthy" ? "income" : budget.status === "warning" ? "warning" : "expense"}>
          {LABELS[budget.status]}
        </Badge>
        <p className="text-xs text-muted-foreground">
          {Number(budget.remaining) >= 0 ? (
            <>
              <MoneyDisplay value={budget.remaining} currency={budget.currencyCode} tone="muted" /> left
            </>
          ) : (
            <>
              <MoneyDisplay value={budget.remaining} currency={budget.currencyCode} tone="expense" /> over
            </>
          )}
        </p>
      </div>
    </div>
  );
}
