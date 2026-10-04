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
        <div className="flex flex-col justify-center border-x border-border px-1 text-center sm:px-4">
          <SummaryCell label="Income" value={formatMoney(income, currency)} tone="text-income" center />
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
  center = false,
}: {
  label: string;
  value: string;
  tone: string;
  center?: boolean;
}) {
  return (
    <div className={cn("min-w-0", center ? "text-center" : "text-center")}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
        {label}
      </p>
      <p className={cn("num mt-1 truncate text-sm font-semibold sm:text-lg", tone)} title={value}>
        {value}
      </p>
    </div>
  );
}
