import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function FinancialSummary({
  income,
  expense,
  total,
  currency,
}: {
  income: string;
  expense: string;
  total: string;
  currency: string;
}) {
  const totalTone = Number(total) >= 0 ? "text-income" : "text-expense";

  return (
    <section className="px-3 pb-4 sm:px-4 lg:px-6" aria-label="Financial summary">
      <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-xl)] border border-border bg-card p-3 shadow-[var(--shadow-soft)] sm:gap-4 sm:p-5">
        <SummaryCell label="Expense" value={formatMoney(expense, currency)} tone="text-expense" />
        <div className="flex min-w-0 flex-col justify-center border-x border-border px-1 sm:px-4">
          <SummaryCell label="Income" value={formatMoney(income, currency)} tone="text-income" />
        </div>
        <SummaryCell label="Total" value={formatMoney(total, currency)} tone={totalTone} />
      </div>
    </section>
  );
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:tracking-wider">
        {label}
      </p>
      <p className={cn("num mt-1 truncate text-sm font-semibold sm:text-lg", tone)} title={value}>
        {value}
      </p>
    </div>
  );
}
