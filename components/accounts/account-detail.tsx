"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { IconBadge } from "@/components/common/icon-badge";
import { MoneyDisplay } from "@/components/common/money-display";
import { TransactionList } from "@/components/records/transaction-list";
import type { LedgerItem } from "@/components/records/types";
import { accountTypeLabel } from "@/lib/constants";
import type { AccountDTO } from "@/lib/services/accounts";
import type { TransactionDTO } from "@/lib/services/transactions";
import type { TransferDTO } from "@/lib/services/transfers";

export function AccountDetail({
  account,
  transactions,
  transfers,
}: {
  account: AccountDTO;
  transactions: TransactionDTO[];
  transfers: TransferDTO[];
}) {
  const router = useRouter();

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
      ].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions, transfers],
  );

  return (
    <>
      <PageHeader title={account.name} subtitle={`${accountTypeLabel(account.type)} · ${account.currencyCode}`} back />

      <div className="space-y-4 pt-4">
        <section className="px-3 sm:px-4 lg:px-6">
          <div className="rounded-[var(--radius-xl)] border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <IconBadge name={account.icon} color={account.color} className="size-12" iconClassName="size-5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current balance
                </p>
                <MoneyDisplay value={account.currentBalance} currency={account.currencyCode} className="text-2xl font-bold" />
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-4">
              <Stat label="Opening" value={account.openingBalance} currency={account.currencyCode} />
              <Stat label="Income" value={account.parts.income} currency={account.currencyCode} tone="income" />
              <Stat label="Expense" value={account.parts.expense} currency={account.currencyCode} tone="expense" />
              <Stat label="Transfers in" value={account.parts.transfersIn} currency={account.currencyCode} />
              <Stat label="Transfers out" value={account.parts.transfersOut} currency={account.currencyCode} />
              <Stat label="Entries" value={String(account.transactionCount)} />
            </dl>

            {account.description ? (
              <p className="mt-4 text-sm text-muted-foreground">{account.description}</p>
            ) : null}
          </div>
        </section>

        <TransactionList
          items={items}
          onSelect={(item) => router.push(`/records?tx=${item.id}`)}
          onAdd={() => router.push("/records")}
        />
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  currency,
  tone = "default",
}: {
  label: string;
  value: string;
  currency?: string;
  tone?: "default" | "income" | "expense";
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">
        {currency ? <MoneyDisplay value={value} currency={currency} tone={tone} /> : value}
      </dd>
    </div>
  );
}
