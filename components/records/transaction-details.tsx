"use client";

import * as React from "react";
import { ArrowRightLeft, Copy, Pencil, Trash2 } from "lucide-react";
import { Badge, Separator } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { IconBadge } from "@/components/common/icon-badge";
import { MoneyDisplay } from "@/components/common/money-display";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { formatLongDate } from "@/lib/finance/dates";
import { deleteTransferAction, deleteTransactionAction, duplicateTransactionAction } from "@/app/(dashboard)/records/actions";
import type { LedgerInitial } from "./types";

export function TransactionDetails({
  open,
  onClose,
  initial,
  onEdit,
  baseCurrency,
}: {
  open: boolean;
  onClose: () => void;
  initial: LedgerInitial;
  onEdit: (value: LedgerInitial) => void;
  baseCurrency: string;
}) {
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  if (!initial) {
    return (
      <Modal open={open} onClose={onClose} title="Details">
        <p className="text-sm text-muted-foreground">Nothing to show.</p>
      </Modal>
    );
  }

  const isTransfer = initial.kind === "transfer";
  const title = isTransfer ? "Transfer" : initial.data.type === "income" ? "Income" : "Expense";

  async function handleDuplicate() {
    if (initial?.kind !== "transaction") return;
    setBusy(true);
    const result = await duplicateTransactionAction(initial.data.id);
    setBusy(false);
    if (result.ok) {
      toast({ title: "Transaction duplicated", tone: "success" });
      onClose();
    } else {
      toast({ title: "Unable to duplicate", description: result.error, tone: "error" });
    }
  }

  async function handleDelete() {
    const result =
      initial?.kind === "transfer"
        ? await deleteTransferAction(initial.data.id)
        : initial?.kind === "transaction"
          ? await deleteTransactionAction(initial.data.id)
          : null;
    if (!result) return;
    if (result.ok) toast({ title: "Deleted", tone: "success" });
    else toast({ title: "Unable to delete", description: result.error, tone: "error" });
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={title}>
        {initial.kind === "transaction" ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <IconBadge
                name={initial.data.category?.icon ?? "Ellipsis"}
                color={initial.data.category?.color ?? "#96967f"}
                className="size-14"
                iconClassName="size-6"
              />
              <p className="text-base font-semibold">{initial.data.category?.name ?? "Uncategorised"}</p>
              <MoneyDisplay
                value={initial.data.amount}
                currency={initial.data.currencyCode}
                tone={initial.data.type === "income" ? "income" : "expense"}
                className="text-2xl font-bold"
              />
              <Badge tone={initial.data.type === "income" ? "income" : "expense"}>
                {initial.data.type === "income" ? "Income" : "Expense"}
              </Badge>
            </div>

            <Separator />

            <dl className="space-y-3 text-sm">
              <Row label="Account" value={initial.data.account.name} />
              <Row label="Date" value={formatLongDate(new Date(initial.data.transactionDate))} />
              <Row label="Currency" value={initial.data.currencyCode} />
              {initial.data.currencyCode !== baseCurrency ? (
                <>
                  <Row label="Exchange rate" value={initial.data.exchangeRate} />
                  <Row
                    label={`Base amount (${baseCurrency})`}
                    value={`${baseCurrency} ${initial.data.baseAmount}`}
                  />
                </>
              ) : null}
              {initial.data.note ? <Row label="Note" value={initial.data.note} /> : null}
            </dl>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                <ArrowRightLeft className="size-6" />
              </span>
              <p className="text-base font-semibold">
                {initial.data.fromAccount.name} → {initial.data.toAccount.name}
              </p>
              <MoneyDisplay
                value={initial.data.fromAmount}
                currency={initial.data.fromCurrency}
                className="text-2xl font-bold"
              />
              {initial.data.fromCurrency !== initial.data.toCurrency ? (
                <p className="text-sm text-muted-foreground">
                  Received <MoneyDisplay value={initial.data.toAmount} currency={initial.data.toCurrency} />
                </p>
              ) : null}
            </div>

            <Separator />

            <dl className="space-y-3 text-sm">
              <Row label="Date" value={formatLongDate(new Date(initial.data.transactionDate))} />
              <Row label="Rate" value={`${initial.data.exchangeRate} ${initial.data.toCurrency}/${initial.data.fromCurrency}`} />
              {initial.data.note ? <Row label="Note" value={initial.data.note} /> : null}
            </dl>
          </div>
        )}

        <Separator className="my-5" />

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => onEdit(initial)} className="flex-1">
            <Pencil className="size-4" /> Edit
          </Button>
          {initial.kind === "transaction" ? (
            <Button variant="secondary" size="sm" onClick={handleDuplicate} loading={busy} className="flex-1">
              <Copy className="size-4" /> Duplicate
            </Button>
          ) : null}
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} className="flex-1">
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={isTransfer ? "Delete transfer?" : "Delete transaction?"}
        description="This will permanently remove the entry and update your balances."
        confirmLabel="Delete"
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[65%] break-words text-right font-medium">{value}</dd>
    </div>
  );
}
