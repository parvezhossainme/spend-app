import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/actions/result";
import { convertToBase, toDecimal, toDisplayString } from "@/lib/finance/money";
import { parseIsoDate, todayInTimeZone } from "@/lib/finance/dates";
import type { TransactionInput } from "@/lib/validations/transaction";

export type TransactionAccount = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  currencyCode: string;
};

export type TransactionCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type TransactionDTO = {
  id: string;
  type: "income" | "expense";
  amount: string;
  currencyCode: string;
  exchangeRate: string;
  baseAmount: string;
  transactionDate: string;
  note: string | null;
  account: TransactionAccount;
  category: TransactionCategory | null;
};

const transactionInclude = {
  account: { select: { id: true, name: true, icon: true, color: true, type: true, currencyCode: true } },
  category: { select: { id: true, name: true, icon: true, color: true } },
} satisfies Prisma.TransactionInclude;

type TransactionWithRelations = Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>;

export function serializeTransaction(transaction: TransactionWithRelations): TransactionDTO {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: toDisplayString(transaction.amount),
    currencyCode: transaction.currencyCode,
    exchangeRate: transaction.exchangeRate.toString(),
    baseAmount: toDisplayString(transaction.baseAmount),
    transactionDate: transaction.transactionDate.toISOString(),
    note: transaction.note,
    account: transaction.account,
    category: transaction.category,
  };
}

export type RangeFilter = { from?: Date; to?: Date };

export type TransactionQuery = {
  from?: Date;
  to?: Date;
  type?: "income" | "expense";
  accountId?: string;
  categoryId?: string;
  currency?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
  sort?: "newest" | "oldest" | "highest" | "lowest";
  limit?: number;
};

function buildTransactionWhere(userId: string, query: TransactionQuery): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { userId };

  if (query.from || query.to) {
    where.transactionDate = {};
    if (query.from) where.transactionDate.gte = query.from;
    if (query.to) where.transactionDate.lt = query.to;
  }
  if (query.type) where.type = query.type;
  if (query.accountId) where.accountId = query.accountId;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.currency) where.currencyCode = query.currency;
  if (query.minAmount || query.maxAmount) {
    where.baseAmount = {};
    if (query.minAmount) where.baseAmount.gte = toDecimal(query.minAmount);
    if (query.maxAmount) where.baseAmount.lte = toDecimal(query.maxAmount);
  }
  if (query.search) {
    where.OR = [
      { note: { contains: query.search, mode: "insensitive" } },
      { category: { name: { contains: query.search, mode: "insensitive" } } },
      { account: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  return where;
}

function buildOrderBy(sort: TransactionQuery["sort"]): Prisma.TransactionOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ transactionDate: "asc" }, { createdAt: "asc" }];
    case "highest":
      return [{ baseAmount: "desc" }, { transactionDate: "desc" }];
    case "lowest":
      return [{ baseAmount: "asc" }, { transactionDate: "desc" }];
    default:
      return [{ transactionDate: "desc" }, { createdAt: "desc" }];
  }
}

export async function listTransactions(userId: string, query: TransactionQuery = {}): Promise<TransactionDTO[]> {
  const transactions = await prisma.transaction.findMany({
    where: buildTransactionWhere(userId, query),
    include: transactionInclude,
    orderBy: buildOrderBy(query.sort),
    take: query.limit ?? 500,
  });
  return transactions.map(serializeTransaction);
}

export async function getTransaction(userId: string, id: string): Promise<TransactionDTO | null> {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId }, include: transactionInclude });
  return transaction ? serializeTransaction(transaction) : null;
}

export type MonthSummary = {
  income: string;
  expense: string;
  total: string;
  count: number;
};

/** Aggregated in the user's base currency so mixed-currency months still total correctly. */
export async function getMonthSummary(userId: string, start: Date, end: Date): Promise<MonthSummary> {
  const grouped = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId, transactionDate: { gte: start, lt: end } },
    _sum: { baseAmount: true },
    _count: { _all: true },
  });

  const income = grouped.find((row) => row.type === "income")?._sum.baseAmount ?? toDecimal(0);
  const expense = grouped.find((row) => row.type === "expense")?._sum.baseAmount ?? toDecimal(0);
  const count = grouped.reduce((total, row) => total + row._count._all, 0);

  return {
    income: toDisplayString(income),
    expense: toDisplayString(expense),
    total: toDisplayString(toDecimal(income).minus(toDecimal(expense))),
    count,
  };
}

export async function getMonthTotalsForRange(
  userId: string,
  start: Date,
  end: Date,
): Promise<{ income: string; expense: string }> {
  const summary = await getMonthSummary(userId, start, end);
  return { income: summary.income, expense: summary.expense };
}

async function assertAccountOwnership(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true, currencyCode: true },
  });
  if (!account) throw new DomainError("Account not found.");
  return account;
}

async function assertCategoryOwnership(userId: string, categoryId: string, type: "income" | "expense") {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true, type: true },
  });
  if (!category) throw new DomainError("Category not found.");
  if (category.type !== type) throw new DomainError("Category type does not match the transaction type.");
  return category;
}

async function resolveAmounts(
  userId: string,
  accountId: string,
  amountValue: string,
  exchangeRateValue: string | null | undefined,
) {
  const account = await assertAccountOwnership(userId, accountId);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { defaultCurrency: true },
  });

  const amount = toDecimal(amountValue);
  const isCrossCurrency = account.currencyCode !== user.defaultCurrency;

  let exchangeRate = toDecimal(1);
  if (isCrossCurrency) {
    if (!exchangeRateValue) throw new DomainError("Currency conversion rate missing.");
    exchangeRate = toDecimal(exchangeRateValue);
    if (exchangeRate.lessThanOrEqualTo(0)) throw new DomainError("Currency conversion rate is invalid.");
  }

  const baseAmount = convertToBase(amount, exchangeRate, account.currencyCode, user.defaultCurrency);
  return { currencyCode: account.currencyCode, exchangeRate, baseAmount, amount };
}

function resolveTransactionDate(value: string): Date {
  const parsed = parseIsoDate(value);
  if (!parsed) throw new DomainError("Invalid transaction date.");
  return parsed;
}

export async function createTransaction(userId: string, input: TransactionInput): Promise<TransactionDTO> {
  const { currencyCode, exchangeRate, baseAmount, amount } = await resolveAmounts(
    userId,
    input.accountId,
    input.amount,
    input.exchangeRate,
  );

  if (input.categoryId) await assertCategoryOwnership(userId, input.categoryId, input.type);

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      accountId: input.accountId,
      categoryId: input.categoryId || null,
      type: input.type,
      amount,
      currencyCode,
      exchangeRate,
      baseAmount,
      transactionDate: resolveTransactionDate(input.transactionDate),
      note: input.note?.trim() || null,
    },
    include: transactionInclude,
  });

  return serializeTransaction(transaction);
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: TransactionInput,
): Promise<TransactionDTO> {
  const existing = await prisma.transaction.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw new DomainError("Transaction not found.");

  const { currencyCode, exchangeRate, baseAmount, amount } = await resolveAmounts(
    userId,
    input.accountId,
    input.amount,
    input.exchangeRate,
  );

  if (input.categoryId) await assertCategoryOwnership(userId, input.categoryId, input.type);

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      accountId: input.accountId,
      categoryId: input.categoryId || null,
      type: input.type,
      amount,
      currencyCode,
      exchangeRate,
      baseAmount,
      transactionDate: resolveTransactionDate(input.transactionDate),
      note: input.note?.trim() || null,
    },
    include: transactionInclude,
  });

  return serializeTransaction(transaction);
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const result = await prisma.transaction.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new DomainError("Transaction not found.");
}

export async function duplicateTransaction(userId: string, id: string): Promise<TransactionDTO> {
  const original = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!original) throw new DomainError("Transaction not found.");

  const copy = await prisma.transaction.create({
    data: {
      userId,
      accountId: original.accountId,
      categoryId: original.categoryId,
      type: original.type,
      amount: original.amount,
      currencyCode: original.currencyCode,
      exchangeRate: original.exchangeRate,
      baseAmount: original.baseAmount,
      transactionDate: todayInTimeZone(),
      note: original.note,
    },
    include: transactionInclude,
  });

  return serializeTransaction(copy);
}
