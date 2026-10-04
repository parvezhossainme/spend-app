"use client";

import * as React from "react";
import { Calculator, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { BudgetCard } from "./budget-card";
import { BudgetDialog } from "./budget-dialog";
import { deleteBudgetAction, setBudgetActiveAction } from "@/app/(dashboard)/budgets/actions";
import type { BudgetDTO } from "@/lib/services/budgets";
import type { CategoryOption } from "@/components/records/types";

export function BudgetsView({
  budgets,
  categories,
  defaultCurrency,
}: {
  budgets: BudgetDTO[];
  categories: CategoryOption[];
  defaultCurrency: string;
}) {
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BudgetDTO | null>(null);
  const [deleting, setDeleting] = React.useState<BudgetDTO | null>(null);

  const active = budgets.filter((budget) => budget.isActive);
  const inactive = budgets.filter((budget) => !budget.isActive);

  async function handleToggle(budget: BudgetDTO, isActive: boolean) {
    const result = await setBudgetActiveAction(budget.id, isActive);
    if (result.ok) toast({ title: isActive ? "Budget activated" : "Budget deactivated", tone: "success" });
    else toast({ title: "Unable to update budget", description: result.error, tone: "error" });
  }

  async function handleDelete() {
    if (!deleting) return;
    const result = await deleteBudgetAction(deleting.id);
    if (result.ok) toast({ title: "Budget deleted", tone: "success" });
    else toast({ title: "Unable to delete budget", description: result.error, tone: "error" });
  }

  return (
    <>
      <PageHeader title="Budgets" subtitle={`${active.length} active`} />

      <div className="pt-4">
        {budgets.length === 0 ? (
          <EmptyState
            icon={<Calculator className="size-6" />}
            title="No budgets yet"
            description="Set a monthly limit for a category and keep your spending on track."
            action={
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
                className="rounded-[var(--radius-md)] border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-[var(--accent)]"
              >
                + Add budget
              </button>
            }
          />
        ) : (
          <div className="space-y-6 px-3 sm:px-4 lg:px-6">
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {active.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
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
                <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                  {inactive.map((budget) => (
                    <BudgetCard
                      key={budget.id}
                      budget={budget}
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
        aria-label="Add budget"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_12px_28px_-8px_rgba(0,0,0,0.6)] transition-transform active:scale-95 lg:bottom-8 lg:right-8"
      >
        <Plus className="size-6" strokeWidth={2.4} />
      </button>

      <BudgetDialog
        key={`${dialogOpen ? "open" : "closed"}:${editing?.id ?? "new"}`}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        budget={editing}
        categories={categories}
        defaultCurrency={defaultCurrency}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={`Delete “${deleting?.name ?? ""}”?`}
        description="The budget and its category links will be removed."
        confirmLabel="Delete budget"
      />
    </>
  );
}
