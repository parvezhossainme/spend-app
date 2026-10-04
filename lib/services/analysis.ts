import { prisma } from "@/lib/db/prisma";
import { toDecimal, toDisplayString } from "@/lib/finance/money";
import { computeAccountBalances, type AccountDTO } from "@/lib/services/accounts";
import { formatShortDate, monthStart, startOfWeek } from "@/lib/finance/dates";

export type CategoryBreakdownItem = {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  amount: string;
  count: number;
  percentage: number;
};

export type CategoryBreakdown = {
  items: CategoryBreakdownItem[];
  total: string;
  largest: { name: string; amount: string } | null;
};

/** Category totals are aggregated in the base currency via `baseAmount`. */
export async function getCategoryBreakdown(
  userId: string,
  type: "income" | "expense",
  start: Date,
  end: Date,
): Promise<CategoryBreakdown> {
  const groups = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type, transactionDate: { gte: start, lt: end } },
    _sum: { baseAmount: true },
    _count: { _all: true },
    orderBy: { _sum: { baseAmount: "desc" } },
  });

  const categoryIds = groups.map((group) => group.categoryId).filter((id): id is string => Boolean(id));
  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: { userId, id: { in: categoryIds } },
        select: { id: true, name: true, icon: true, color: true },
      })
    : [];
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const total = groups.reduce((sum, group) => sum.add(group._sum.baseAmount ?? 0), toDecimal(0));

  const items: CategoryBreakdownItem[] = groups.map((group) => {
    const amount = group._sum.baseAmount ?? toDecimal(0);
    const category = group.categoryId ? categoryMap.get(group.categoryId) : undefined;
    return {
      categoryId: group.categoryId,
      name: category?.name ?? "Uncategorised",
      icon: category?.icon ?? "Ellipsis",
      color: category?.color ?? "#96967f",
      amount: toDisplayString(amount),
      count: group._count._all,
      percentage: total.isZero() ? 0 : amount.div(total).mul(100).toDecimalPlaces(1).toNumber(),
    };
  });

  const largest =
    items.length > 0 ? { name: items[0].name, amount: items[0].amount } : null;

  return { items, total: toDisplayString(total), largest };
}

export type FlowGranularity = "day" | "week" | "month";

export type FlowPoint = {
  key: string;
  label: string;
  income: string;
  expense: string;
  net: string;
};

function bucketKey(date: Date, granularity: FlowGranularity, weekStartsOn: number): { key: string; date: Date } {
  if (granularity === "month") {
    const start = monthStart(date);
    return { key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`, date: start };
  }
  if (granularity === "week") {
    const start = startOfWeek(date, weekStartsOn);
    return { key: start.toISOString().slice(0, 10), date: start };
  }
  return { key: date.toISOString().slice(0, 10), date };
}

function labelFor(date: Date, granularity: FlowGranularity): string {
  if (granularity === "month") {
    return date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  }
  return formatShortDate(date).slice(0, 6);
}

/**
 * Time series of income vs expense (in base currency) for a range.
 * Only the range's rows and the two needed columns are read.
 */
export async function getFlowSeries(
  userId: string,
  start: Date,
  end: Date,
  granularity: FlowGranularity,
  weekStartsOn = 0,
): Promise<FlowPoint[]> {
  const transactions = await prisma.transaction.findMany({
    where: { userId, transactionDate: { gte: start, lt: end } },
    select: { transactionDate: true, type: true, baseAmount: true },
    orderBy: { transactionDate: "asc" },
  });

  const buckets = new Map<string, { date: Date; income: ReturnType<typeof toDecimal>; expense: ReturnType<typeof toDecimal> }>();

  for (const transaction of transactions) {
    const { key, date } = bucketKey(transaction.transactionDate, granularity, weekStartsOn);
    const bucket = buckets.get(key) ?? { date, income: toDecimal(0), expense: toDecimal(0) };
    if (transaction.type === "income") bucket.income = bucket.income.add(transaction.baseAmount);
    else bucket.expense = bucket.expense.add(transaction.baseAmount);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, bucket]) => ({
      key: bucket.date.toISOString().slice(0, 10),
      label: labelFor(bucket.date, granularity),
      income: toDisplayString(bucket.income),
      expense: toDisplayString(bucket.expense),
      net: toDisplayString(bucket.income.sub(bucket.expense)),
    }));
}

export type AccountAnalysisRow = {
  account: AccountDTO;
  activity: number;
};

export async function getAccountAnalysis(userId: string): Promise<{ rows: AccountAnalysisRow[]; totalBalance: string }> {
  const rows = await computeAccountBalances(userId);

  const totalBalance = rows.reduce((sum, row) => sum.add(row.currentBalance), toDecimal(0));

  return {
    rows: rows.map((row) => ({ account: row.dto, activity: row.dto.transactionCount })),
    totalBalance: toDisplayString(totalBalance),
  };
}

export type LargestTransaction = { id: string; name: string; amount: string; date: string } | null;

export async function getLargestTransaction(
  userId: string,
  type: "income" | "expense",
  start: Date,
  end: Date,
): Promise<LargestTransaction> {
  const transaction = await prisma.transaction.findFirst({
    where: { userId, type, transactionDate: { gte: start, lt: end } },
    orderBy: { baseAmount: "desc" },
    include: { category: { select: { name: true } } },
  });
  if (!transaction) return null;
  return {
    id: transaction.id,
    name: transaction.category?.name ?? transaction.note ?? (type === "income" ? "Income" : "Expense"),
    amount: toDisplayString(transaction.baseAmount),
    date: transaction.transactionDate.toISOString(),
  };
}
