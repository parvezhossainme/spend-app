"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { IconPicker } from "@/components/common/icon-picker";
import { CURRENCIES, getCurrency } from "@/lib/currency";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { accountSchema } from "@/lib/validations/finance";
import { createAccountAction, updateAccountAction } from "@/app/(dashboard)/accounts/actions";
import type { AccountDTO } from "@/lib/services/accounts";

type FormState = {
  name: string;
  type: string;
  currencyCode: string;
  openingBalance: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  name: "",
  type: "cash",
  currencyCode: "BDT",
  openingBalance: "0",
  description: "",
  icon: "Wallet",
  color: "#E8D9A0",
  isActive: true,
};

export function AccountDialog({
  open,
  onClose,
  account,
  defaultCurrency,
}: {
  open: boolean;
  onClose: () => void;
  account: AccountDTO | null;
  defaultCurrency: string;
}) {
  const toast = useToast();
  const [form, setForm] = React.useState<FormState>(() =>
    account
      ? {
          name: account.name,
          type: account.type,
          currencyCode: account.currencyCode,
          openingBalance: account.openingBalance,
          description: account.description ?? "",
          icon: account.icon,
          color: account.color,
          isActive: account.isActive,
        }
      : { ...EMPTY, currencyCode: defaultCurrency },
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = accountSchema.safeParse({
      ...form,
      openingBalance: form.openingBalance.trim() || "0",
      description: form.description.trim() || null,
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
    const result = account ? await updateAccountAction(account.id, parsed.data) : await createAccountAction(parsed.data);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    toast({ title: account ? "Account updated" : "Account created", tone: "success" });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={account ? "Edit account" : "Add account"} size="md">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="account-name">Name</Label>
          <Input
            id="account-name"
            placeholder="e.g. Card"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
          />
          <FieldError>{errors.name}</FieldError>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="account-type">Type</Label>
            <Select id="account-type" value={form.type} onChange={(event) => update("type", event.target.value)}>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="account-currency">Currency</Label>
            <Select
              id="account-currency"
              value={form.currencyCode}
              onChange={(event) => update("currencyCode", event.target.value)}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.flag} {currency.code}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="opening-balance">
            Opening balance ({getCurrency(form.currencyCode).symbol})
          </Label>
          <Input
            id="opening-balance"
            inputMode="decimal"
            value={form.openingBalance}
            onChange={(event) => update("openingBalance", event.target.value.replace(/[^\d.]/g, ""))}
          />
          <FieldError>{errors.openingBalance}</FieldError>
        </div>

        <div>
          <Label htmlFor="account-description">Description</Label>
          <Textarea
            id="account-description"
            placeholder="Optional note about this account"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            className="min-h-16"
          />
        </div>

        <IconPicker icon={form.icon} color={form.color} onChange={(value) => setForm((previous) => ({ ...previous, ...value }))} />

        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">Inactive accounts are hidden from new entries.</p>
          </div>
          <Switch checked={form.isActive} onCheckedChange={(value) => update("isActive", value)} aria-label="Active" />
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
            Save account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
