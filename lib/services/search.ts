import { prisma } from "@/lib/db/prisma";
import { listTransactions, type TransactionDTO, type TransactionQuery } from "@/lib/services/transactions";
import { computeAccountBalances } from "@/lib/services/accounts";
import { serializeTransfer, type TransferDTO } from "@/lib/services/transfers";

export type SearchCategory = { id: string; name: string; type: "income" | "expense"; icon: string; color: string };
export type SearchAccount = { id: string; name: string; icon: string; color: string; currencyCode: string; balance: string };

export type SearchResults = {
  query: string;
  transactions: TransactionDTO[];
  transfers: TransferDTO[];
  categories: SearchCategory[];
  accounts: SearchAccount[];
};

export async function searchAll(userId: string, query: string, filters: TransactionQuery = {}): Promise<SearchResults> {
  const trimmed = query.trim();
  const dateRange =
    filters.from || filters.to ? { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lt: filters.to } : {}) } : undefined;

  const [transactions, transferRows, categories, accountsRaw] = await Promise.all([
    trimmed
      ? listTransactions(userId, { ...filters, search: trimmed, limit: 50 })
      : filters.from || filters.to || filters.type
        ? listTransactions(userId, { ...filters, limit: 50 })
        : Promise.resolve([] as TransactionDTO[]),
    trimmed
      ? prisma.transfer.findMany({
          where: {
            userId,
            ...(dateRange ? { transactionDate: dateRange } : {}),
            OR: [
              { note: { contains: trimmed, mode: "insensitive" } },
              { fromAccount: { name: { contains: trimmed, mode: "insensitive" } } },
              { toAccount: { name: { contains: trimmed, mode: "insensitive" } } },
            ],
          },
          include: {
            fromAccount: { select: { id: true, name: true, icon: true, color: true } },
            toAccount: { select: { id: true, name: true, icon: true, color: true } },
          },
          orderBy: { transactionDate: "desc" },
          take: 25,
        })
      : Promise.resolve([]),
    trimmed
      ? prisma.category.findMany({
          where: { userId, name: { contains: trimmed, mode: "insensitive" } },
          select: { id: true, name: true, type: true, icon: true, color: true },
          take: 10,
        })
      : Promise.resolve([] as SearchCategory[]),
    trimmed
      ? prisma.account.findMany({
          where: { userId, name: { contains: trimmed, mode: "insensitive" } },
          select: { id: true },
          take: 10,
        })
      : Promise.resolve([] as { id: string }[]),
  ]);

  let accounts: SearchAccount[] = [];
  if (accountsRaw.length > 0) {
    const balances = await computeAccountBalances(userId);
    const idSet = new Set(accountsRaw.map((account) => account.id));
    accounts = balances
      .filter((row) => idSet.has(row.account.id))
      .map((row) => ({
        id: row.account.id,
        name: row.account.name,
        icon: row.account.icon,
        color: row.account.color,
        currencyCode: row.account.currencyCode,
        balance: row.dto.currentBalance,
      }));
  }

  return {
    query: trimmed,
    transactions,
    transfers: transferRows.map((transfer) =>
      serializeTransfer(transfer as Parameters<typeof serializeTransfer>[0]),
    ),
    categories,
    accounts,
  };
}
