import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/actions/result";
import { toDecimal, toDisplayString, ZERO } from "@/lib/finance/money";
import type { AccountInput } from "@/lib/validations/finance";
import type { AccountType } from "@prisma/client";

export type AccountBalanceParts = {
  income: string;
  expense: string;
  transfersIn: string;
  transfersOut: string;
};

export type AccountDTO = {
  id: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  openingBalance: string;
  currentBalance: string;
  description: string | null;
  icon: string;
  color: string;
  isActive: boolean;
  transactionCount: number;
  parts: AccountBalanceParts;
};

/**
 * Account balance = opening
 *   + income − expense
 *   + incoming transfers − outgoing transfers
 *
 * All four aggregates are fetched with grouped queries (never by loading every
 * transaction row) so this stays fast as the ledger grows.
 */
export async function computeAccountBalances(userId: string, accountIds?: string[]) {
  const accountFilter = accountIds?.length ? { id: { in: accountIds } } : {};

  const accounts = await prisma.account.findMany({
    where: { userId, ...accountFilter },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  const [transactionGroups, transferOutGroups, transferInGroups] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["accountId", "type"],
      where: { userId, ...(accountIds?.length ? { accountId: { in: accountIds } } : {}) },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transfer.groupBy({
      by: ["fromAccountId"],
      where: { userId, ...(accountIds?.length ? { fromAccountId: { in: accountIds } } : {}) },
      _sum: { fromAmount: true },
    }),
    prisma.transfer.groupBy({
      by: ["toAccountId"],
      where: { userId, ...(accountIds?.length ? { toAccountId: { in: accountIds } } : {}) },
      _sum: { toAmount: true },
    }),
  ]);

  const incomeMap = new Map<string, { sum: typeof ZERO; count: number }>();
  const expenseMap = new Map<string, { sum: typeof ZERO; count: number }>();
  for (const group of transactionGroups) {
    const sum = group._sum.amount ?? ZERO;
    if (group.type === "income") {
      incomeMap.set(group.accountId, { sum, count: group._count._all });
    } else {
      expenseMap.set(group.accountId, { sum, count: group._count._all });
    }
  }

  const outgoing = new Map(transferOutGroups.map((group) => [group.fromAccountId, group._sum.fromAmount ?? ZERO]));
  const incoming = new Map(transferInGroups.map((group) => [group.toAccountId, group._sum.toAmount ?? ZERO]));

  return accounts.map((account) => {
    const income = incomeMap.get(account.id)?.sum ?? ZERO;
    const expense = expenseMap.get(account.id)?.sum ?? ZERO;
    const transfersOut = outgoing.get(account.id) ?? ZERO;
    const transfersIn = incoming.get(account.id) ?? ZERO;
    const transactionCount = (incomeMap.get(account.id)?.count ?? 0) + (expenseMap.get(account.id)?.count ?? 0);

    const currentBalance = toDecimal(account.openingBalance)
      .add(income)
      .sub(expense)
      .add(transfersIn)
      .sub(transfersOut);

    const dto: AccountDTO = {
      id: account.id,
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      openingBalance: toDisplayString(account.openingBalance),
      currentBalance: toDisplayString(currentBalance),
      description: account.description,
      icon: account.icon,
      color: account.color,
      isActive: account.isActive,
      transactionCount,
      parts: {
        income: toDisplayString(income),
        expense: toDisplayString(expense),
        transfersIn: toDisplayString(transfersIn),
        transfersOut: toDisplayString(transfersOut),
      },
    };

    return { account, dto, currentBalance };
  });
}

export async function listAccounts(userId: string): Promise<AccountDTO[]> {
  const rows = await computeAccountBalances(userId);
  return rows.map((row) => row.dto);
}

export async function listActiveAccounts(userId: string) {
  const rows = await computeAccountBalances(userId);
  return rows
    .filter((row) => row.account.isActive)
    .map((row) => ({
      id: row.account.id,
      name: row.account.name,
      type: row.account.type,
      currencyCode: row.account.currencyCode,
      icon: row.account.icon,
      color: row.account.color,
    }));
}

export async function getAccount(userId: string, id: string): Promise<AccountDTO | null> {
  const rows = await computeAccountBalances(userId, [id]);
  return rows[0]?.dto ?? null;
}

export async function createAccount(userId: string, input: AccountInput): Promise<void> {
  await prisma.account.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      currencyCode: input.currencyCode,
      openingBalance: toDecimal(input.openingBalance ?? "0"),
      description: input.description?.trim() || null,
      icon: input.icon,
      color: input.color,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateAccount(userId: string, id: string, input: AccountInput): Promise<void> {
  const existing = await prisma.account.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw new DomainError("Account not found.");

  await prisma.account.update({
    where: { id },
    data: {
      name: input.name,
      type: input.type,
      currencyCode: input.currencyCode,
      openingBalance: toDecimal(input.openingBalance ?? "0"),
      description: input.description?.trim() || null,
      icon: input.icon,
      color: input.color,
      isActive: input.isActive ?? true,
    },
  });
}

export async function setAccountActive(userId: string, id: string, isActive: boolean): Promise<void> {
  const result = await prisma.account.updateMany({ where: { id, userId }, data: { isActive } });
  if (result.count === 0) throw new DomainError("Account not found.");
}

/** Accounts with ledger history are protected — deactivate them instead. */
export async function deleteAccount(userId: string, id: string): Promise<void> {
  const account = await prisma.account.findFirst({ where: { id, userId }, select: { id: true } });
  if (!account) throw new DomainError("Account not found.");

  const [transactionCount, transferCount] = await Promise.all([
    prisma.transaction.count({ where: { userId, accountId: id } }),
    prisma.transfer.count({ where: { userId, OR: [{ fromAccountId: id }, { toAccountId: id }] } }),
  ]);

  if (transactionCount > 0 || transferCount > 0) {
    throw new DomainError("This account has transactions. Deactivate it instead of deleting.");
  }

  await prisma.account.delete({ where: { id } });
}
