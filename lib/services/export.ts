import { prisma } from "@/lib/db/prisma";
import { toDisplayString } from "@/lib/finance/money";
import { formatIsoDate, formatShortDate } from "@/lib/finance/dates";

export type ExportRow = {
  date: string;
  type: string;
  category: string;
  account: string;
  amount: string;
  currency: string;
  note: string;
};

export type ExportSummary = {
  income: string;
  expense: string;
  net: string;
  currency: string;
  count: number;
  label: string;
};

export type ExportData = {
  rows: ExportRow[];
  summary: ExportSummary;
  generatedAt: string;
};

export async function buildExportData(
  userId: string,
  range: { from: Date; to: Date },
  label: string,
): Promise<ExportData> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { defaultCurrency: true },
  });

  const [transactions, transfers] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, transactionDate: { gte: range.from, lt: range.to } },
      orderBy: { transactionDate: "asc" },
      include: {
        category: { select: { name: true } },
        account: { select: { name: true } },
      },
    }),
    prisma.transfer.findMany({
      where: { userId, transactionDate: { gte: range.from, lt: range.to } },
      orderBy: { transactionDate: "asc" },
      include: {
        fromAccount: { select: { name: true } },
        toAccount: { select: { name: true } },
      },
    }),
  ]);

  const rows: ExportRow[] = [];

  let incomeTotal = 0;
  let expenseTotal = 0;

  for (const transaction of transactions) {
    const amount = toDisplayString(transaction.amount);
    const base = Number(transaction.baseAmount);
    if (transaction.type === "income") incomeTotal += base;
    else expenseTotal += base;

    rows.push({
      date: formatIsoDate(transaction.transactionDate),
      type: transaction.type === "income" ? "Income" : "Expense",
      category: transaction.category?.name ?? "Uncategorised",
      account: transaction.account.name,
      amount: transaction.type === "expense" ? `-${amount}` : amount,
      currency: transaction.currencyCode,
      note: transaction.note ?? "",
    });
  }

  for (const transfer of transfers) {
    rows.push({
      date: formatIsoDate(transfer.transactionDate),
      type: "Transfer",
      category: "Transfer",
      account: `${transfer.fromAccount.name} → ${transfer.toAccount.name}`,
      amount: `${toDisplayString(transfer.fromAmount)} ${transfer.fromCurrency} → ${toDisplayString(transfer.toAmount)} ${transfer.toCurrency}`,
      currency: transfer.fromCurrency,
      note: transfer.note ?? "",
    });
  }

  rows.sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    rows,
    summary: {
      income: incomeTotal.toFixed(2),
      expense: expenseTotal.toFixed(2),
      net: (incomeTotal - expenseTotal).toFixed(2),
      currency: user.defaultCurrency,
      count: rows.length,
      label,
    },
    generatedAt: formatShortDate(new Date()),
  };
}

export function toCsv(data: ExportData): string {
  const header = ["Date", "Type", "Category", "Account", "Amount", "Currency", "Note"];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = [header.map(escape).join(",")];
  for (const row of data.rows) {
    lines.push(
      [row.date, row.type, row.category, row.account, row.amount, row.currency, row.note].map(escape).join(","),
    );
  }

  lines.push("");
  lines.push([escape("Summary")].join(","));
  lines.push([escape("Total income"), escape(data.summary.income), escape(data.summary.currency)].join(","));
  lines.push([escape("Total expense"), escape(data.summary.expense), escape(data.summary.currency)].join(","));
  lines.push([escape("Net balance"), escape(data.summary.net), escape(data.summary.currency)].join(","));

  return lines.join("\n");
}
