"use server";

import { requireUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { searchAll, type SearchResults } from "@/lib/services/search";
import type { TransactionQuery } from "@/lib/services/transactions";
import { parseIsoDate } from "@/lib/finance/dates";

export type SearchFiltersInput = {
  type?: "income" | "expense" | "transfer" | "all";
  accountId?: string;
  categoryId?: string;
  currency?: string;
  from?: string;
  to?: string;
  minAmount?: string;
  maxAmount?: string;
  sort?: "newest" | "oldest" | "highest" | "lowest";
};

export async function searchAction(input: {
  query: string;
  filters?: SearchFiltersInput;
}): Promise<SearchResults> {
  const userId = await requireUserId();
  const filters = input.filters ?? {};

  const from = filters.from ? parseIsoDate(filters.from) ?? undefined : undefined;
  const to = filters.to ? parseIsoDate(filters.to) ?? undefined : undefined;

  const query: TransactionQuery = {
    type: filters.type && filters.type !== "all" && filters.type !== "transfer" ? filters.type : undefined,
    accountId: filters.accountId || undefined,
    categoryId: filters.categoryId || undefined,
    currency: filters.currency || undefined,
    minAmount: filters.minAmount || undefined,
    maxAmount: filters.maxAmount || undefined,
    sort: filters.sort,
    // `to` is inclusive for the user, so push it to the next day for the half-open range.
    from,
    to: to ? new Date(to.getTime() + 86_400_000) : undefined,
  };

  return searchAll(userId, input.query, query);
}

export type FilterOptions = {
  accounts: { id: string; name: string; icon: string; color: string; currencyCode: string }[];
  categories: { id: string; name: string; type: "income" | "expense"; icon: string; color: string }[];
  currencies: string[];
};

export async function getFilterOptions(): Promise<FilterOptions> {
  const userId = await requireUserId();
  const [accounts, categories, currencies] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, icon: true, color: true, currencyCode: true },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true, icon: true, color: true },
    }),
    prisma.transaction.findMany({ where: { userId }, distinct: ["currencyCode"], select: { currencyCode: true } }),
  ]);

  return {
    accounts,
    categories: categories as FilterOptions["categories"],
    currencies: currencies.map((row) => row.currencyCode),
  };
}
