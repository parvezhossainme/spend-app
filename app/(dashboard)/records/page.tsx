import { requireUser } from "@/lib/auth/session";
import { normalizeSearchParams } from "@/lib/query";
import { CURRENCIES } from "@/lib/currency";
import {
  addDays,
  formatMonthLabel,
  isSameMonth,
  monthBounds,
  parseIsoDate,
  parseMonthParam,
  shiftMonth,
  toMonthParam,
  todayInTimeZone,
} from "@/lib/finance/dates";
import { getMonthSummary, getTransaction, listTransactions } from "@/lib/services/transactions";
import { getTransfer, listTransfers } from "@/lib/services/transfers";
import { listSelectableCategories } from "@/lib/services/categories";
import { listActiveAccounts } from "@/lib/services/accounts";
import { RecordsView } from "@/components/records/records-view";
import type { RecordFilters } from "@/components/records/transaction-filters";
import type { LedgerInitial } from "@/components/records/types";
import type { TransactionQuery } from "@/lib/services/transactions";

const FILTER_KEYS = [
  "type",
  "accountId",
  "categoryId",
  "currency",
  "from",
  "to",
  "minAmount",
  "maxAmount",
  "sort",
] as const;

const SORTS = ["newest", "oldest", "highest", "lowest"] as const;

export default async function RecordsPage({ searchParams }: PageProps<"/records">) {
  const user = await requireUser();
  const params = normalizeSearchParams(await searchParams);

  const today = todayInTimeZone();
  const month = parseMonthParam(params.month) ?? monthBounds(today).start;
  const { start, end } = monthBounds(month);

  const filters: RecordFilters = {};
  for (const key of FILTER_KEYS) {
    if (params[key]) filters[key] = params[key];
  }

  const from = filters.from ? parseIsoDate(filters.from) : undefined;
  const to = filters.to ? parseIsoDate(filters.to) : undefined;
  const sort = SORTS.includes(filters.sort as (typeof SORTS)[number])
    ? (filters.sort as (typeof SORTS)[number])
    : "newest";

  const query: TransactionQuery = {
    from: from ?? start,
    to: to ? addDays(to, 1) : end,
    type: filters.type === "income" || filters.type === "expense" ? filters.type : undefined,
    accountId: filters.accountId,
    categoryId: filters.categoryId,
    currency: filters.currency,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
    sort,
  };

  const [transactions, transfers, summary, accounts, categories] = await Promise.all([
    listTransactions(user.id, query),
    listTransfers(user.id, { from: query.from, to: query.to }),
    getMonthSummary(user.id, start, end),
    listActiveAccounts(user.id),
    listSelectableCategories(user.id),
  ]);

  let initialEntry: LedgerInitial = null;
  if (params.tx) {
    const transaction = await getTransaction(user.id, params.tx);
    if (transaction) {
      initialEntry = { kind: "transaction", data: transaction };
    } else {
      const transfer = await getTransfer(user.id, params.tx);
      if (transfer) initialEntry = { kind: "transfer", data: transfer };
    }
  }

  return (
    <RecordsView
      monthParam={toMonthParam(month)}
      monthLabel={formatMonthLabel(month)}
      previousMonthParam={toMonthParam(shiftMonth(month, -1))}
      nextMonthParam={toMonthParam(shiftMonth(month, 1))}
      isCurrentMonth={isSameMonth(month, today)}
      query={filters as Record<string, string>}
      filters={filters}
      summary={summary}
      transactions={transactions}
      transfers={transfers}
      accounts={accounts}
      categories={categories}
      baseCurrency={user.defaultCurrency}
      filterOptions={{ accounts, categories, currencies: CURRENCIES.map((currency) => currency.code) }}
      initialEntry={initialEntry}
    />
  );
}
