"use client";

import * as React from "react";
import { Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { MoneyDisplay } from "@/components/common/money-display";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { AccountCard } from "./account-card";
import { AccountDialog } from "./account-dialog";
import { deleteAccountAction, setAccountActiveAction } from "@/app/(dashboard)/accounts/actions";
import type { AccountDTO } from "@/lib/services/accounts";

export function AccountsView({
  accounts,
  baseCurrency,
  totalBalance,
}: {
  accounts: AccountDTO[];
  baseCurrency: string;
  totalBalance: string;
}) {
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AccountDTO | null>(null);
  const [deleting, setDeleting] = React.useState<AccountDTO | null>(null);

  const active = accounts.filter((account) => account.isActive);
  const inactive = accounts.filter((account) => !account.isActive);

  async function handleToggle(account: AccountDTO, isActive: boolean) {
    const result = await setAccountActiveAction(account.id, isActive);
    if (result.ok) toast({ title: isActive ? "Account activated" : "Account deactivated", tone: "success" });
    else toast({ title: "Unable to update account", description: result.error, tone: "error" });
  }

  async function handleDelete() {
    if (!deleting) return;
    const result = await deleteAccountAction(deleting.id);
    if (result.ok) toast({ title: "Account deleted", tone: "success" });
    else toast({ title: "Unable to delete account", description: result.error, tone: "error" });
  }

  return (
    <>
      <PageHeader title="Accounts" subtitle={`${accounts.length} account${accounts.length === 1 ? "" : "s"}`} />

      <div className="pt-4">
        <section className="px-3 pb-4 sm:px-4 lg:px-6">
          <div className="rounded-[var(--radius-xl)] border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total balance
            </p>
            <MoneyDisplay value={totalBalance} currency={baseCurrency} className="mt-1 block text-2xl font-bold" />
            <p className="mt-1 text-xs text-muted-foreground">
              Across {active.length} active account{active.length === 1 ? "" : "s"}
            </p>
          </div>
        </section>

        {accounts.length === 0 ? (
          <EmptyState
            icon={<Wallet className="size-6" />}
            title="No accounts yet"
            description="Create a cash, bank, card or mobile wallet account to start tracking."
            action={
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
                className="rounded-[var(--radius-md)] border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-[var(--accent)]"
              >
                + Add account
              </button>
            }
          />
        ) : (
          <div className="space-y-5 px-3 sm:px-4 lg:px-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {active.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={(value) => {
                    setEditing(value);
                    setDialogOpen(true);
                  }}
                  onDelete={setDeleting}
                  onToggleActive={handleToggle}
                />
              ))}
            </div>

            {inactive.length > 0 ? (
              <div>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Inactive
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {inactive.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onEdit={(value) => {
                        setEditing(value);
                        setDialogOpen(true);
                      }}
                      onDelete={setDeleting}
                      onToggleActive={handleToggle}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Add account"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_12px_28px_-8px_rgba(0,0,0,0.6)] transition-transform active:scale-95 lg:bottom-8 lg:right-8"
      >
        <Plus className="size-6" strokeWidth={2.4} />
      </button>

      <AccountDialog
        key={`${dialogOpen ? "open" : "closed"}:${editing?.id ?? "new"}`}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        account={editing}
        defaultCurrency={baseCurrency}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={`Delete “${deleting?.name ?? ""}”?`}
        description="Accounts with transactions cannot be deleted — deactivate them instead."
        confirmLabel="Delete account"
      />
    </>
  );
}
