import { formatMoney, type DecimalLike } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function MoneyDisplay({
  value,
  currency,
  tone = "default",
  className,
  signed = false,
}: {
  value: DecimalLike | null | undefined;
  currency?: string | null;
  tone?: "default" | "income" | "expense" | "muted";
  className?: string;
  signed?: boolean;
}) {
  const formatted = formatMoney(value, currency);
  const isNegative = formatted.startsWith("-");
  const withSign = signed && !isNegative ? `+${formatted}` : formatted;

  const tones = {
    default: "text-foreground",
    income: "text-income",
    expense: "text-expense",
    muted: "text-muted-foreground",
  } as const;

  return <span className={cn("num tabular-nums", tones[tone], className)}>{withSign}</span>;
}
