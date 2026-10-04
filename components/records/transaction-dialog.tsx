"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { formatMoney, getCurrency } from "@/lib/currency";
import { formatIsoDate, todayInTimeZone } from "@/lib/finance/dates";
import { transactionSchema, transferSchema } from "@/lib/validations/transaction";
import {
  createTransactionAction,
  createTransferAction,
  updateTransactionAction,
  updateTransferAction,
} from "@/app/(dashboard)/records/actions";
import type { AccountOption, CategoryOption, LedgerInitial } from "./types";

type LedgerType = "expense" | "income" | "transfer";

export function TransactionDialog({
  open,
  onClose,
  accounts,
  categories,
  baseCurrency,
  initial = null,
}: {
  open: boolean;
  onClose: () => void;
  accounts: AccountOption[];
  categories: CategoryOption[];
  baseCurrency: string;
  initial?: LedgerInitial;
}) {
  const toast = useToast();
  const [initialState] = React.useState(() => buildInitialState(initial, accounts));
  const [type, setType] = React.useState<LedgerType>(initialState.type);
  const [amount, setAmount] = React.useState(initialState.amount);
  const [accountId, setAccountId] = React.useState(initialState.accountId);
  const [categoryId, setCategoryId] = React.useState(initialState.categoryId);
  const [date, setDate] = React.useState(initialState.date);
  const [note, setNote] = React.useState(initialState.note);
  const [exchangeRate, setExchangeRate] = React.useState(initialState.exchangeRate);
  const [fromAccountId, setFromAccountId] = React.useState(initialState.fromAccountId);
  const [toAccountId, setToAccountId] = React.useState(initialState.toAccountId);
  const [fromAmount, setFromAmount] = React.useState(initialState.fromAmount);
  const [toAmount, setToAmount] = React.useState(initialState.toAmount);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const selectedAccount = accounts.find((account) => account.id === accountId);
  const accountCurrency = selectedAccount?.currencyCode ?? baseCurrency;
  const fromAccount = accounts.find((account) => account.id === fromAccountId);
  const toAccount = accounts.find((account) => account.id === toAccountId);
  const isCrossCurrency = Boolean(fromAccount && toAccount && fromAccount.currencyCode !== toAccount.currencyCode);
  const needsRate = type !== "transfer" && accountCurrency !== baseCurrency;

  const filteredCategories = categories.filter((category) => category.type === type);
  const isEdit = Boolean(initial);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    if (type === "transfer") {
      const payload = {
        fromAccountId,
        toAccountId,
        fromAmount: fromAmount.trim(),
        toAmount: toAmount.trim() || fromAmount.trim(),
        exchangeRate: exchangeRate || null,
        transactionDate: date,
        note,
      };
      const parsed = transferSchema.safeParse(payload);
      if (!parsed.success) {
        setErrors(flattenErrors(parsed.error.flatten().fieldErrors));
        return;
      }
      setSaving(true);
      const result =
        initial?.kind === "transfer"
          ? await updateTransferAction(initial.data.id, parsed.data)
          : await createTransferAction(parsed.data);
      setSaving(false);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      toast({ title: initial?.kind === "transfer" ? "Transfer updated" : "Transfer saved", tone: "success" });
      onClose();
      return;
    }

    const payload = {
      type,
      amount: amount.trim(),
      accountId,
      categoryId: categoryId || null,
      transactionDate: date,
      note,
      exchangeRate: needsRate ? exchangeRate || null : null,
    };
    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(flattenErrors(parsed.error.flatten().fieldErrors));
      return;
    }
    setSaving(true);
    const result =
      initial?.kind === "transaction"
        ? await updateTransactionAction(initial.data.id, parsed.data)
        : await createTransactionAction(parsed.data);
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    toast({ title: initial?.kind === "transaction" ? "Transaction updated" : "Transaction saved", tone: "success" });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit entry" : "Add Transaction"}
      description={isEdit ? undefined : "Record money coming in, going out, or moving between accounts."}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Segmented
          value={type}
          onChange={(value) => setType(value)}
          options={[
            { value: "expense", label: "Expense", tone: "expense" },
            { value: "income", label: "Income", tone: "income" },
            { value: "transfer", label: "Transfer" },
          ]}
        />

        {type === "transfer" ? (
          <>
            <div>
              <Label htmlFor="fromAccount">From</Label>
              <Select id="fromAccount" value={fromAccountId} onChange={(event) => setFromAccountId(event.target.value)}>
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {account.currencyCode}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.fromAccountId}</FieldError>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fromAmount">Amount {fromAccount ? `(${fromAccount.currencyCode})` : ""}</Label>
                <Input
                  id="fromAmount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(event) => setFromAmount(sanitizeAmount(event.target.value))}
                />
                <FieldError>{errors.fromAmount}</FieldError>
              </div>
              <div>
                <Label htmlFor="toAccount">To</Label>
                <Select id="toAccount" value={toAccountId} onChange={(event) => setToAccountId(event.target.value)}>
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.currencyCode}
                    </option>
                  ))}
                </Select>
                <FieldError>{errors.toAccountId}</FieldError>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="toAmount">
                  Received {toAccount ? `(${toAccount.currencyCode})` : ""}
                </Label>
                <Input
                  id="toAmount"
                  inputMode="decimal"
                  placeholder={isCrossCurrency ? "0.00" : "Same as amount"}
                  value={toAmount}
                  disabled={!isCrossCurrency}
                  onChange={(event) => setToAmount(sanitizeAmount(event.target.value))}
                />
                <FieldError>{errors.toAmount}</FieldError>
              </div>
              <div>
                <Label htmlFor="transferRate">Exchange rate</Label>
                <Input
                  id="transferRate"
                  inputMode="decimal"
                  placeholder={isCrossCurrency ? "e.g. 120" : "1"}
                  value={exchangeRate}
                  disabled={!isCrossCurrency}
                  onChange={(event) => setExchangeRate(sanitizeAmount(event.target.value))}
                />
              </div>
            </div>

            {isCrossCurrency ? (
              <p className="text-xs text-muted-foreground">
                Rate is expressed as {toAccount?.currencyCode} per 1 {fromAccount?.currencyCode}.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <div>
              <Label htmlFor="amount">Amount {selectedAccount ? `(${accountCurrency})` : ""}</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                  {getCurrency(accountCurrency).symbol}
                </span>
                <Input
                  id="amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(sanitizeAmount(event.target.value))}
                  className="num h-14 pl-10 text-2xl font-semibold"
                />
              </div>
              <FieldError>{errors.amount}</FieldError>
              {amount ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatMoney(amount, accountCurrency)}
                  {needsRate && exchangeRate ? ` ≈ ${formatMoney(Number(amount) * Number(exchangeRate), baseCurrency)}` : ""}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="account">Account</Label>
                <Select id="account" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.currencyCode}
                    </option>
                  ))}
                </Select>
                <FieldError>{errors.accountId}</FieldError>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select id="category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                  <option value="">Uncategorised</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {needsRate ? (
              <div>
                <Label htmlFor="rate">Exchange rate ({accountCurrency} → {baseCurrency})</Label>
                <Input
                  id="rate"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={exchangeRate}
                  onChange={(event) => setExchangeRate(sanitizeAmount(event.target.value))}
                />
                <FieldError>{errors.exchangeRate}</FieldError>
              </div>
            ) : null}

            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              <FieldError>{errors.transactionDate}</FieldError>
            </div>
          </>
        )}

        <div>
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            placeholder="Optional note"
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-20"
          />
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
            Save {type === "transfer" ? "Transfer" : "Transaction"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

type DialogState = {
  type: LedgerType;
  amount: string;
  accountId: string;
  categoryId: string;
  date: string;
  note: string;
  exchangeRate: string;
  fromAccountId: string;
  toAccountId: string;
  fromAmount: string;
  toAmount: string;
};

function buildInitialState(initial: LedgerInitial, accounts: AccountOption[]): DialogState {
  const primary = accounts[0]?.id ?? "";
  const secondary = accounts[1]?.id ?? "";

  if (initial?.kind === "transaction") {
    const transaction = initial.data;
    return {
      type: transaction.type,
      amount: transaction.amount.replace(/,/g, ""),
      accountId: transaction.account.id,
      categoryId: transaction.category?.id ?? "",
      date: formatIsoDate(new Date(transaction.transactionDate)),
      note: transaction.note ?? "",
      exchangeRate: transaction.exchangeRate,
      fromAccountId: primary,
      toAccountId: secondary,
      fromAmount: "",
      toAmount: "",
    };
  }

  if (initial?.kind === "transfer") {
    const transfer = initial.data;
    return {
      type: "transfer",
      amount: "",
      accountId: primary,
      categoryId: "",
      date: formatIsoDate(new Date(transfer.transactionDate)),
      note: transfer.note ?? "",
      exchangeRate: transfer.exchangeRate,
      fromAccountId: transfer.fromAccount.id,
      toAccountId: transfer.toAccount.id,
      fromAmount: transfer.fromAmount.replace(/,/g, ""),
      toAmount: transfer.toAmount.replace(/,/g, ""),
    };
  }

  return {
    type: "expense",
    amount: "",
    accountId: primary,
    categoryId: "",
    date: formatIsoDate(todayInTimeZone()),
    note: "",
    exchangeRate: "",
    fromAccountId: primary,
    toAccountId: secondary,
    fromAmount: "",
    toAmount: "",
  };
}

function sanitizeAmount(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("").slice(0, 4)}`;
}

function flattenErrors(fieldErrors: Record<string, string[] | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.length) result[key] = messages[0];
  }
  return result;
}
