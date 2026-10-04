"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightLeft, Search, SlidersHorizontal } from "lucide-react";
import { Badge, Separator } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { IconBadge } from "@/components/common/icon-badge";
import { MoneyDisplay } from "@/components/common/money-display";
import { EmptyState } from "@/components/ui/switch";
import { getFilterOptions, searchAction, type FilterOptions, type SearchFiltersInput } from "@/app/(dashboard)/search-actions";
import type { SearchResults } from "@/lib/services/search";
import { formatShortDate } from "@/lib/finance/dates";

const DEFAULT_FILTERS: SearchFiltersInput = { type: "all", sort: "newest" };

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState<SearchFiltersInput>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = React.useState(false);
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [options, setOptions] = React.useState<FilterOptions | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || options) return;
    getFilterOptions()
      .then(setOptions)
      .catch(() => setOptions(null));
  }, [open, options]);

  const hasCriteria =
    query.trim().length > 0 ||
    Boolean(filters.from || filters.to || filters.accountId || filters.categoryId || filters.currency) ||
    (filters.type !== undefined && filters.type !== "all");

  React.useEffect(() => {
    if (!open || !hasCriteria) return;

    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchAction({ query, filters });
        setResults(response);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, filters, open, hasCriteria]);

  function reset() {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
  }

  const transactionCount = results ? results.transactions.length + results.transfers.length : 0;

  return (
    <Modal open={open} onClose={onClose} title="Search" description="Transactions, transfers, categories and accounts." size="md">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search salary, Abbu, Food…"
            className="pl-9 pr-10"
          />
          <button
            type="button"
            aria-label="Toggle filters"
            onClick={() => setShowFilters((value) => !value)}
            className={`absolute right-1 top-1 grid size-9 place-items-center rounded-full transition-colors ${
              showFilters ? "text-[var(--accent)]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

        {showFilters ? (
          <div className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-[var(--input)]/40 p-3">
            <div>
              <Label>Type</Label>
              <Segmented
                size="sm"
                value={filters.type ?? "all"}
                onChange={(value) => setFilters((current) => ({ ...current, type: value }))}
                options={[
                  { value: "all", label: "All" },
                  { value: "income", label: "Income", tone: "income" },
                  { value: "expense", label: "Expense", tone: "expense" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Account</Label>
                <Select
                  value={filters.accountId ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, accountId: event.target.value }))}
                >
                  <option value="">All accounts</option>
                  {options?.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={filters.currency ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, currency: event.target.value }))}
                >
                  <option value="">All currencies</option>
                  {options?.currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From</Label>
                <Input
                  type="date"
                  value={filters.from ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                />
              </div>
              <div>
                <Label>To</Label>
                <Input
                  type="date"
                  value={filters.to ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min amount</Label>
                <Input
                  inputMode="decimal"
                  placeholder="0"
                  value={filters.minAmount ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, minAmount: event.target.value }))}
                />
              </div>
              <div>
                <Label>Max amount</Label>
                <Input
                  inputMode="decimal"
                  placeholder="Any"
                  value={filters.maxAmount ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, maxAmount: event.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Sort</Label>
              <Select
                value={filters.sort ?? "newest"}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, sort: event.target.value as SearchFiltersInput["sort"] }))
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={reset}>
                Clear all
              </Button>
            </div>
          </div>
        ) : null}

        <div className="min-h-[220px]">
          {!hasCriteria ? (
            <EmptyState
              icon={<Search className="size-5" />}
              title="Start typing to search"
              description="Try a category, an account name, a note, or use the filters."
            />
          ) : loading && !results ? (
            <div className="space-y-2 py-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-card-elevated" />
              ))}
            </div>
          ) : results && transactionCount + results.categories.length + results.accounts.length === 0 ? (
            <EmptyState title="No matches" description={`Nothing found for “${query || "your filters"}”.`} />
          ) : results ? (
            <div className="space-y-4">
              {results.transactions.length > 0 ? (
                <ResultGroup title={`Transactions (${results.transactions.length})`}>
                  {results.transactions.map((transaction) => (
                    <Link
                      key={transaction.id}
                      href={`/records?tx=${transaction.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 transition-colors hover:bg-card-elevated"
                    >
                      <IconBadge name={transaction.category?.icon ?? "Ellipsis"} color={transaction.category?.color ?? "#96967f"} className="size-9" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{transaction.category?.name ?? "Uncategorised"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatShortDate(new Date(transaction.transactionDate))} · {transaction.account.name}
                          {transaction.note ? ` · ${transaction.note}` : ""}
                        </p>
                      </div>
                      <MoneyDisplay
                        value={transaction.amount}
                        currency={transaction.currencyCode}
                        tone={transaction.type === "income" ? "income" : "expense"}
                        className="text-sm font-medium"
                      />
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}

              {results.transfers.length > 0 ? (
                <ResultGroup title={`Transfers (${results.transfers.length})`}>
                  {results.transfers.map((transfer) => (
                    <div key={transfer.id} className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2">
                      <span className="grid size-9 place-items-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                        <ArrowRightLeft className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {transfer.fromAccount.name} → {transfer.toAccount.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatShortDate(new Date(transfer.transactionDate))}</p>
                      </div>
                      <MoneyDisplay value={transfer.fromAmount} currency={transfer.fromCurrency} className="text-sm" />
                    </div>
                  ))}
                </ResultGroup>
              ) : null}

              {results.categories.length > 0 ? (
                <ResultGroup title={`Categories (${results.categories.length})`}>
                  {results.categories.map((category) => (
                    <Link
                      key={category.id}
                      href="/categories"
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 transition-colors hover:bg-card-elevated"
                    >
                      <IconBadge name={category.icon} color={category.color} className="size-9" />
                      <span className="flex-1 text-sm font-medium">{category.name}</span>
                      <Badge tone={category.type === "income" ? "income" : "expense"}>{category.type}</Badge>
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}

              {results.accounts.length > 0 ? (
                <ResultGroup title={`Accounts (${results.accounts.length})`}>
                  {results.accounts.map((account) => (
                    <Link
                      key={account.id}
                      href={`/accounts/${account.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 transition-colors hover:bg-card-elevated"
                    >
                      <IconBadge name={account.icon} color={account.color} className="size-9" />
                      <span className="flex-1 text-sm font-medium">{account.name}</span>
                      <MoneyDisplay value={account.balance} currency={account.currencyCode} className="text-sm text-muted-foreground" />
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <span className="mr-2 size-3 animate-pulse rounded-full bg-[var(--accent)]" /> Searching…
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <Separator className="mb-1" />
      <div>{children}</div>
    </div>
  );
}
