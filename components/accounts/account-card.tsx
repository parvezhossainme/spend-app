"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { DropdownItem, DropdownMenu } from "@/components/ui/dropdown";
import { IconBadge } from "@/components/common/icon-badge";
import { MoneyDisplay } from "@/components/common/money-display";
import { accountTypeLabel } from "@/lib/constants";
import type { AccountDTO } from "@/lib/services/accounts";

export function AccountCard({
  account,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  account: AccountDTO;
  onEdit: (account: AccountDTO) => void;
  onDelete: (account: AccountDTO) => void;
  onToggleActive: (account: AccountDTO, isActive: boolean) => void;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <IconBadge name={account.icon} color={account.color} className="size-11" />

        <Link href={`/accounts/${account.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{account.name}</p>
            {!account.isActive ? <Badge tone="muted">Inactive</Badge> : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {accountTypeLabel(account.type)} · {account.currencyCode}
          </p>
          <MoneyDisplay
            value={account.currentBalance}
            currency={account.currencyCode}
            className="mt-2 block text-xl font-bold"
          />
        </Link>

        <DropdownMenu trigger={<MoreVertical className="size-4" />}>
          {(close) => (
            <>
              <DropdownItem icon={<Pencil className="size-4" />} onClick={() => { close(); onEdit(account); }}>
                Edit
              </DropdownItem>
              <DropdownItem
                icon={<Power className="size-4" />}
                onClick={() => { close(); onToggleActive(account, !account.isActive); }}
              >
                {account.isActive ? "Deactivate" : "Activate"}
              </DropdownItem>
              <DropdownItem icon={<Trash2 className="size-4" />} danger onClick={() => { close(); onDelete(account); }}>
                Delete
              </DropdownItem>
            </>
          )}
        </DropdownMenu>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <ArrowUpRight className="size-3.5 text-income" />
          <MoneyDisplay value={account.parts.income} currency={account.currencyCode} tone="muted" />
        </span>
        <span className="flex items-center justify-end gap-1.5 text-muted-foreground">
          <ArrowDownRight className="size-3.5 text-expense" />
          <MoneyDisplay value={account.parts.expense} currency={account.currencyCode} tone="muted" />
        </span>
      </div>
    </div>
  );
}
