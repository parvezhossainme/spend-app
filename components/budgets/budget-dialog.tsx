"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { IconBadge } from "@/components/common/icon-badge";
import { formatIsoDate, todayInTimeZone } from "@/lib/finance/dates";
import { budgetSchema } from "@/lib/validations/finance";
import { createBudgetAction, updateBudgetAction } from "@/app/(dashboard)/budgets/actions";
import type { BudgetDTO } from "@/lib/services/budgets";
import type { CategoryOption } from "@/components/records/types";

export function BudgetDialog({
  open,
  onClose,
  budget,
  categories,
  defaultCurrency,
}: {
  open: boolean;
  onClose: () => void;
  budget: BudgetDTO | null;
  categories: CategoryOption[];
  defaultCurrency: string;
}) {
  const toast = useToast();
  const [name, setName] = React.useState(() => budget?.name ?? "");
  const [amount, setAmount] = React.useState(() => budget?.amount ?? "");
  const [periodType, setPeriodType] = React.useState<"weekly" | "monthly" | "custom">(
    () => budget?.periodType ?? "monthly",
  );
  const [startDate, setStartDate] = React.useState(() =>
    budget ? formatIsoDate(new Date(budget.startDate)) : formatIsoDate(todayInTimeZone()),
  );
  const [endDate, setEndDate] = React.useState(() =>
    budget?.endDate ? formatIsoDate(new Date(budget.endDate)) : "",
  );
  const [categoryIds, setCategoryIds] = React.useState<string[]>(() =>
    budget ? budget.categories.map((category) => category.id) : [],
  );
  const [isActive, setIsActive] = React.useState(() => budget?.isActive ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  function toggleCategory(id: string) {
    setCategoryIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = budgetSchema.safeParse({
      name,
      amount: amount.trim(),
      currencyCode: defaultCurrency,
      periodType,
      startDate,
      endDate: periodType === "custom" ? endDate || null : null,
      isActive,
      categoryIds,
    });

    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const [key, messages] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (messages?.length) flat[key] = messages[0];
      }
      setErrors(flat);
      return;
    }

    setSaving(true);
    const result = budget ? await updateBudgetAction(budget.id, parsed.data) : await createBudgetAction(parsed.data);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    toast({ title: budget ? "Budget updated" : "Budget created", tone: "success" });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={budget ? "Edit budget" : "Add budget"}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="budget-name">Name</Label>
          <Input
            id="budget-name"
            placeholder="e.g. Food"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <FieldError>{errors.name}</FieldError>
        </div>

        <div>
          <Label htmlFor="budget-amount">Amount ({defaultCurrency})</Label>
          <Input
            id="budget-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
            className="num h-12 text-lg font-semibold"
          />
          <FieldError>{errors.amount}</FieldError>
          <p className="mt-1 text-xs text-muted-foreground">
            Budgets are tracked in your default currency ({defaultCurrency}).
          </p>
        </div>

        <div>
          <Label>Period</Label>
          <Segmented
            value={periodType}
            onChange={setPeriodType}
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "custom", label: "Custom" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="budget-start">Start date</Label>
            <Input id="budget-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <FieldError>{errors.startDate}</FieldError>
          </div>
          {periodType === "custom" ? (
            <div>
              <Label htmlFor="budget-end">End date</Label>
              <Input id="budget-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              <FieldError>{errors.endDate}</FieldError>
            </div>
          ) : (
            <div>
              <Label htmlFor="budget-currency">Currency</Label>
              <Select id="budget-currency" value={defaultCurrency} disabled>
                <option value={defaultCurrency}>{defaultCurrency}</option>
              </Select>
            </div>
          )}
        </div>

        <div>
          <Label>Categories</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            Spending in these categories counts towards the budget.
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = categoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--accent)]"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <IconBadge name={category.icon} color={category.color} className="size-5" iconClassName="size-3" />
                  {category.name}
                </button>
              );
            })}
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">No expense categories yet.</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">Inactive budgets are not tracked.</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Active" />
        </div>

        {formError ? (
          <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--expense)]/30 bg-[var(--expense)]/10 px-3 py-2 text-sm text-expense">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="flex gap-2 pb-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="flex-[2]">
            Save budget
          </Button>
        </div>
      </form>
    </Modal>
  );
}
