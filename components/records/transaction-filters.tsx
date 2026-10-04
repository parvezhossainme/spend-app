"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { toQueryString } from "@/lib/query";
import type { FilterOptions } from "@/app/(dashboard)/search-actions";

export type RecordFilters = {
  type?: string;
  accountId?: string;
  categoryId?: string;
  currency?: string;
  from?: string;
  to?: string;
  minAmount?: string;
  maxAmount?: string;
  sort?: string;
};

export const EMPTY_FILTERS: RecordFilters = {};

export function countActiveFilters(filters: RecordFilters): number {
  return Object.values(filters).filter((value) => value !== undefined && value !== "" && value !== "all").length;
}

export function TransactionFilters({
  open,
  onClose,
  options,
  current,
  monthParam,
}: {
  open: boolean;
  onClose: () => void;
  options: FilterOptions;
  current: RecordFilters;
  monthParam: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filters"
      description="Narrow the ledger by type, account, category, currency, date or amount."
    >
      <FilterBody options={options} current={current} monthParam={monthParam} onClose={onClose} />
    </Modal>
  );
}

/** Mounted only while the dialog is open, so the draft resets from `current` on each open. */
function FilterBody({
  options,
  current,
  monthParam,
  onClose,
}: {
  options: FilterOptions;
  current: RecordFilters;
  monthParam: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<RecordFilters>(current);

  function update<K extends keyof RecordFilters>(key: K, value: RecordFilters[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function apply() {
    const params: Record<string, string | undefined> = { ...draft, month: monthParam };
    router.push(`/records${toQueryString(params)}`);
    onClose();
  }

  function clear() {
    setDraft({});
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <Label>Type</Label>
          <Segmented
            value={(draft.type as string) ?? "all"}
            onChange={(value) => update("type", value === "all" ? undefined : value)}
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
            <Select value={draft.accountId ?? ""} onChange={(event) => update("accountId", event.target.value)}>
              <option value="">All accounts</option>
              {options.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={draft.categoryId ?? ""} onChange={(event) => update("categoryId", event.target.value)}>
              <option value="">All categories</option>
              {options.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.type})
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Currency</Label>
          <Select value={draft.currency ?? ""} onChange={(event) => update("currency", event.target.value)}>
            <option value="">All currencies</option>
            {options.currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>From date</Label>
            <Input type="date" value={draft.from ?? ""} onChange={(event) => update("from", event.target.value)} />
          </div>
          <div>
            <Label>To date</Label>
            <Input type="date" value={draft.to ?? ""} onChange={(event) => update("to", event.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Min amount</Label>
            <Input
              inputMode="decimal"
              placeholder="0"
              value={draft.minAmount ?? ""}
              onChange={(event) => update("minAmount", event.target.value)}
            />
          </div>
          <div>
            <Label>Max amount</Label>
            <Input
              inputMode="decimal"
              placeholder="Any"
              value={draft.maxAmount ?? ""}
              onChange={(event) => update("maxAmount", event.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Sort</Label>
          <Select
            value={draft.sort ?? "newest"}
            onChange={(event) => update("sort", event.target.value === "newest" ? undefined : event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
          </Select>
        </div>
      </div>

      <div className="mt-5 flex gap-2 pb-1">
        <Button type="button" variant="secondary" onClick={clear} className="flex-1">
          Clear
        </Button>
        <Button type="button" onClick={apply} className="flex-[2]">
          Apply filters
        </Button>
      </div>
    </>
  );
}
