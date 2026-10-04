import { addDays, monthStart, nextMonthStart, parseIsoDate, shiftMonth } from "@/lib/finance/dates";

export type RangeKey = "this-month" | "last-month" | "last-3-months" | "last-6-months" | "this-year" | "custom";

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "last-6-months", label: "Last 6 months" },
  { value: "this-year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

export function resolveRange(
  key: string | undefined,
  from: string | undefined,
  to: string | undefined,
  today: Date,
): { key: RangeKey; start: Date; end: Date; label: string } {
  const validKey = RANGE_OPTIONS.some((option) => option.value === key) ? (key as RangeKey) : "this-month";

  switch (validKey) {
    case "last-month": {
      const start = shiftMonth(monthStart(today), -1);
      return { key: validKey, start, end: nextMonthStart(start), label: "Last month" };
    }
    case "last-3-months": {
      const start = shiftMonth(monthStart(today), -2);
      return { key: validKey, start, end: nextMonthStart(today), label: "Last 3 months" };
    }
    case "last-6-months": {
      const start = shiftMonth(monthStart(today), -5);
      return { key: validKey, start, end: nextMonthStart(today), label: "Last 6 months" };
    }
    case "this-year": {
      const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      const end = new Date(Date.UTC(today.getUTCFullYear() + 1, 0, 1));
      return { key: validKey, start, end, label: `${today.getUTCFullYear()}` };
    }
    case "custom": {
      const parsedFrom = from ? parseIsoDate(from) : null;
      const parsedTo = to ? parseIsoDate(to) : null;
      if (parsedFrom && parsedTo) {
        return { key: validKey, start: parsedFrom, end: addDays(parsedTo, 1), label: "Custom range" };
      }
      const start = monthStart(today);
      return { key: "this-month", start, end: nextMonthStart(today), label: "This month" };
    }
    default: {
      const start = monthStart(today);
      return { key: "this-month", start, end: nextMonthStart(today), label: "This month" };
    }
  }
}
