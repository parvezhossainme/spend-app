"use client";

import * as React from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MonthSelector } from "./month-selector";
import { FinancialSummary } from "./financial-summary";
import { TransactionDetails } from "./transaction-details";
import { TransactionDialog } from "./transaction-dialog";
import { TransactionList } from "./transaction-list";
import { TransactionFilters, countActiveFilters, type RecordFilters } from "./transaction-filters";
import type { AccountOption, CategoryOption, LedgerInitial, LedgerItem } from "./types";
import type { FilterOptions } from "@/app/(dashboard)/search-actions";
import type { MonthSummary, TransactionDTO } from "@/lib/services/transactions";
import type { TransferDTO } from "@/lib/services/transfers";

export function RecordsView({
  monthParam,
  monthLabel,
  previousMonthParam,
  nextMonthParam,
  isCurrentMonth,
  query,
  filters,
  summary,
  transactions,
  transfers,
  accounts,
  categories,
  baseCurrency,
  filterOptions,
  initialEntry,
}: {
  monthParam: string;
  monthLabel: string;
  previousMonthParam: string;
  nextMonthParam: string;
  isCurrentMonth: boolean;
  query: Record<string, string>;
  filters: RecordFilters;
  summary: MonthSummary;
  transactions: TransactionDTO[];
  transfers: TransferDTO[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  baseCurrency: string;
  filterOptions: FilterOptions;
  initialEntry: LedgerInitial;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LedgerInitial>(null);
  const [details, setDetails] = React.useState<LedgerInitial>(initialEntry);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const activeFilters = countActiveFilters(filters);

  const items = React.useMemo<LedgerItem[]>(
    () =>
      [
        ...transactions.map((transaction) => ({
          kind: "transaction" as const,
          id: transaction.id,
          date: transaction.transactionDate,
          data: transaction,
        })),
        ...transfers.map((transfer) => ({
          kind: "transfer" as const,
          id: transfer.id,
          date: transfer.transactionDate,
          data: transfer,
        })),
      ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [transactions, transfers],
  );

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleEdit(value: LedgerInitial) {
    setDetails(null);
    setEditing(value);
    setDialogOpen(true);
  }

  return (
    <>
      <PageHeader
        brand
        title="Records"
        subtitle={`${summary.count} entr${summary.count === 1 ? "y" : "ies"} · ${monthLabel}`}
        actions={
          <button
            type="button"
            aria-label="Filters"
            onClick={() => setFiltersOpen(true)}
            className="relative grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <SlidersHorizontal className="size-5" />
            {activeFilters > 0 ? (
              <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-[var(--accent-foreground)]">
                {activeFilters}
              </span>
            ) : null}
          </button>
        }
      >
        <MonthSelector
          monthLabel={monthLabel}
          previousMonthParam={previousMonthParam}
          nextMonthParam={nextMonthParam}
          isCurrent={isCurrentMonth}
          query={query}
        />
      </PageHeader>

      <div className="pt-4">
        <FinancialSummary
          income={summary.income}
          expense={summary.expense}
          total={summary.total}
          currency={baseCurrency}
        />

        {activeFilters > 0 ? (
          <div className="px-3 pb-3 sm:px-4 lg:px-6">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-[var(--accent)] hover:underline"
            >
              {activeFilters} filter{activeFilters === 1 ? "" : "s"} active — adjust or clear
            </button>
          </div>
        ) : null}

        <TransactionList items={items} onSelect={(item) => setDetails(item as LedgerInitial)} onAdd={openAdd} />
      </div>

      <button
        type="button"
        onClick={openAdd}
        aria-label="Add transaction"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_12px_28px_-8px_rgba(0,0,0,0.6)] transition-transform active:scale-95 lg:bottom-8 lg:right-8"
      >
        <Plus className="size-6" strokeWidth={2.4} />
      </button>

      <TransactionDialog
        key={`${dialogOpen ? "open" : "closed"}:${editing?.kind ?? "new"}:${editing?.data.id ?? ""}`}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        accounts={accounts}
        categories={categories}
        baseCurrency={baseCurrency}
        initial={editing}
      />

      <TransactionDetails
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        initial={details}
        onEdit={handleEdit}
        baseCurrency={baseCurrency}
      />

      <TransactionFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        options={filterOptions}
        current={filters}
        monthParam={monthParam}
      />
    </>
  );
}
