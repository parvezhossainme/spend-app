"use client";

import * as React from "react";
import { BarChart3, Inbox, TrendingDown, TrendingUp } from "lucide-react";
import { Badge, Separator } from "@/components/ui/card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/switch";
import { IconBadge } from "@/components/common/icon-badge";
import { MoneyDisplay } from "@/components/common/money-display";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryBarChart, SimpleBarChart } from "@/components/charts/category-bar-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { FlowAreaChart, FlowLineChart } from "@/components/charts/flow-chart";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/finance/ranges";
import { toQueryString } from "@/lib/query";
import { formatMoney, toNumber } from "@/lib/currency";
import type { AccountAnalysisRow, CategoryBreakdown, FlowPoint } from "@/lib/services/analysis";

export type AnalysisViewKey = "expense" | "income" | "expense-flow" | "income-flow" | "accounts";

const VIEW_OPTIONS: { value: AnalysisViewKey; label: string }[] = [
  { value: "expense", label: "Expense overview" },
  { value: "income", label: "Income overview" },
  { value: "expense-flow", label: "Expense flow" },
  { value: "income-flow", label: "Income flow" },
  { value: "accounts", label: "Account analysis" },
];

const VIEW_TITLES: Record<AnalysisViewKey, string> = {
  expense: "Expense overview",
  income: "Income overview",
  "expense-flow": "Expense flow",
  "income-flow": "Income flow",
  accounts: "Account analysis",
};

type FlowSets = { day: FlowPoint[]; week: FlowPoint[]; month: FlowPoint[] };

export function AnalysisView({
  view,
  rangeKey,
  from,
  to,
  rangeLabel,
  currency,
  expense,
  income,
  flow,
  accounts,
  totalBalance,
  largestExpense,
  largestIncome,
}: {
  view: AnalysisViewKey;
  rangeKey: RangeKey;
  from: string;
  to: string;
  rangeLabel: string;
  currency: string;
  expense: CategoryBreakdown;
  income: CategoryBreakdown;
  flow: FlowSets;
  accounts: AccountAnalysisRow[];
  totalBalance: string;
  largestExpense: { name: string; amount: string; date: string } | null;
  largestIncome: { name: string; amount: string; date: string } | null;
}) {
  const router = useRouter();
  const [activeView, setActiveView] = React.useState<AnalysisViewKey>(view);
  const [granularity, setGranularity] = React.useState<"day" | "week" | "month">("month");
  const [customFrom, setCustomFrom] = React.useState(from);
  const [customTo, setCustomTo] = React.useState(to);

  function pushRange(nextRange: string, nextFrom?: string, nextTo?: string) {
    router.push(
      `/analysis${toQueryString({
        view: activeView,
        range: nextRange,
        from: nextFrom,
        to: nextTo,
      })}`,
    );
  }

  const series = flow[granularity].map((point) => ({
    label: point.label,
    income: toNumber(point.income),
    expense: toNumber(point.expense),
    net: toNumber(point.net),
  }));

  const breakdown = activeView === "income" ? income : expense;
  const breakdownTone = activeView === "income" ? "income" : "expense";
  const donutData = breakdown.items.map((item) => ({
    name: item.name,
    value: toNumber(item.amount),
    color: item.color,
  }));
  const barData = breakdown.items.slice(0, 8).map((item) => ({
    name: item.name,
    value: toNumber(item.amount),
    color: item.color,
  }));
  const largest = activeView === "income" ? largestIncome : largestExpense;

  const accountBarData = accounts.map((row) => ({
    name: row.account.name,
    value: toNumber(row.account.currentBalance),
  }));

  return (
    <>
      <PageHeader title="Analysis" subtitle={`${VIEW_TITLES[activeView]} · ${rangeLabel}`} />

      <div className="space-y-4 px-3 pt-4 sm:px-4 lg:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="analysis-view">Analysis</Label>
            <Select
              id="analysis-view"
              value={activeView}
              onChange={(event) => setActiveView(event.target.value as AnalysisViewKey)}
            >
              {VIEW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="analysis-range">Date range</Label>
            <Select id="analysis-range" value={rangeKey} onChange={(event) => pushRange(event.target.value)}>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {rangeKey === "custom" ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="analysis-from">From</Label>
              <Input id="analysis-from" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            </div>
            <div className="flex-1">
              <Label htmlFor="analysis-to">To</Label>
              <Input id="analysis-to" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </div>
            <Button type="button" onClick={() => pushRange("custom", customFrom, customTo)}>
              Apply
            </Button>
          </div>
        ) : null}

        {activeView === "accounts" ? (
          <AccountsPanel accounts={accounts} totalBalance={totalBalance} currency={currency} barData={accountBarData} />
        ) : activeView === "expense-flow" || activeView === "income-flow" ? (
          <FlowPanel
            title={VIEW_TITLES[activeView]}
            series={series}
            currency={currency}
            granularity={granularity}
            onGranularityChange={setGranularity}
            mode={activeView === "income-flow" ? "income" : "expense"}
          />
        ) : (
          <BreakdownPanel
            title={VIEW_TITLES[activeView]}
            tone={breakdownTone}
            breakdown={breakdown}
            donutData={donutData}
            barData={barData}
            series={series}
            currency={currency}
            granularity={granularity}
            onGranularityChange={setGranularity}
            largest={largest}
          />
        )}
      </div>
    </>
  );
}

function BreakdownPanel({
  title,
  tone,
  breakdown,
  donutData,
  barData,
  series,
  currency,
  granularity,
  onGranularityChange,
  largest,
}: {
  title: string;
  tone: "income" | "expense";
  breakdown: CategoryBreakdown;
  donutData: { name: string; value: number; color: string }[];
  barData: { name: string; value: number; color: string }[];
  series: { label: string; income: number; expense: number; net: number }[];
  currency: string;
  granularity: "day" | "week" | "month";
  onGranularityChange: (value: "day" | "week" | "month") => void;
  largest: { name: string; amount: string; date: string } | null;
}) {
  if (breakdown.items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Inbox className="size-6" />}
          title={`No ${tone} analysis for this range`}
          description="There is no data to summarise yet. Try a different date range."
        />
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total {tone}
            </p>
            <MoneyDisplay value={breakdown.total} currency={currency} tone={tone} className="mt-1 block text-xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Categories</p>
            <p className="num mt-1 text-xl font-bold">{breakdown.items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Largest {tone}
            </p>
            {largest ? (
              <>
                <p className="mt-1 truncate text-sm font-semibold">{largest.name}</p>
                <MoneyDisplay value={largest.amount} currency={currency} tone={tone} className="text-sm" />
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title} by category</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <CategoryDonut data={donutData} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top categories</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <CategoryBarChart data={barData} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Trend</CardTitle>
          <div className="w-40">
            <Segmented
              size="sm"
              value={granularity}
              onChange={onGranularityChange}
              options={[
                { value: "day", label: "D" },
                { value: "week", label: "W" },
                { value: "month", label: "M" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <FlowLineChart
            data={series}
            currency={currency}
            dataKey={tone}
            name={tone === "income" ? "Income" : "Expense"}
            color={tone === "income" ? "var(--income)" : "var(--expense)"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Category breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <ul className="divide-y divide-[var(--border)]">
            {breakdown.items.map((item) => (
              <li key={item.categoryId ?? item.name} className="flex items-center gap-3 py-3">
                <IconBadge name={item.icon} color={item.color} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.count} entr{item.count === 1 ? "y" : "ies"}
                  </p>
                </div>
                <div className="text-right">
                  <MoneyDisplay value={item.amount} currency={currency} tone={tone} className="text-sm font-semibold" />
                  <p className="num text-xs text-muted-foreground">{item.percentage}%</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

function FlowPanel({
  title,
  series,
  currency,
  granularity,
  onGranularityChange,
  mode,
}: {
  title: string;
  series: { label: string; income: number; expense: number; net: number }[];
  currency: string;
  granularity: "day" | "week" | "month";
  onGranularityChange: (value: "day" | "week" | "month") => void;
  mode: "income" | "expense";
}) {
  const totalIncome = series.reduce((sum, point) => sum + point.income, 0);
  const totalExpense = series.reduce((sum, point) => sum + point.expense, 0);
  const net = totalIncome - totalExpense;

  if (series.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<BarChart3 className="size-6" />}
          title="No analysis for this range"
          description="Nothing to chart for these dates yet."
        />
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="size-3.5 text-income" /> Income
            </p>
            <MoneyDisplay value={String(totalIncome)} currency={currency} tone="income" className="mt-1 block text-xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingDown className="size-3.5 text-expense" /> Expense
            </p>
            <MoneyDisplay value={String(totalExpense)} currency={currency} tone="expense" className="mt-1 block text-xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Net balance</p>
            <MoneyDisplay
              value={String(net)}
              currency={currency}
              tone={net >= 0 ? "income" : "expense"}
              className="mt-1 block text-xl font-bold"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <div className="w-40">
            <Segmented
              size="sm"
              value={granularity}
              onChange={onGranularityChange}
              options={[
                { value: "day", label: "Daily" },
                { value: "week", label: "Weekly" },
                { value: "month", label: "Monthly" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {mode === "expense" ? (
            <FlowAreaChart data={series} currency={currency} />
          ) : (
            <FlowLineChart data={series} currency={currency} dataKey="income" name="Income" color="var(--income)" />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AccountsPanel({
  accounts,
  totalBalance,
  currency,
  barData,
}: {
  accounts: AccountAnalysisRow[];
  totalBalance: string;
  currency: string;
  barData: { name: string; value: number }[];
}) {
  if (accounts.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Inbox className="size-6" />} title="No accounts yet" description="Add an account to see account analysis." />
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total balance</p>
          <MoneyDisplay value={totalBalance} currency={currency} className="mt-1 block text-2xl font-bold" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Balances by account</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <SimpleBarChart data={barData} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <ul className="divide-y divide-[var(--border)]">
            {accounts.map((row) => (
              <li key={row.account.id} className="py-3">
                <div className="flex items-center gap-3">
                  <IconBadge name={row.account.icon} color={row.account.color} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.activity} entr{row.activity === 1 ? "y" : "ies"}
                    </p>
                  </div>
                  <MoneyDisplay
                    value={row.account.currentBalance}
                    currency={row.account.currencyCode}
                    className="text-sm font-semibold"
                  />
                </div>

                <div className="mt-2 grid grid-cols-4 gap-2 pl-12 text-[11px] text-muted-foreground">
                  <span>
                    In <MoneyDisplay value={row.account.parts.income} currency={row.account.currencyCode} tone="income" className="text-[11px]" />
                  </span>
                  <span>
                    Out <MoneyDisplay value={row.account.parts.expense} currency={row.account.currencyCode} tone="expense" className="text-[11px]" />
                  </span>
                  <span>
                    +T <MoneyDisplay value={row.account.parts.transfersIn} currency={row.account.currencyCode} className="text-[11px]" />
                  </span>
                  <span>
                    −T <MoneyDisplay value={row.account.parts.transfersOut} currency={row.account.currencyCode} className="text-[11px]" />
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <Separator className="mt-2" />
          <p className="pt-3 text-xs text-muted-foreground">
            Transfers move money between accounts and never count as income or expense.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

export function LargestHint({ largest, currency }: { largest: { name: string; amount: string } | null; currency: string }) {
  if (!largest) return null;
  return (
    <Badge tone="muted">
      {largest.name} · {formatMoney(largest.amount, currency)}
    </Badge>
  );
}
