"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { CategoryDialog } from "./category-dialog";
import { CategoryList } from "./category-list";
import {
  deleteCategoryAction,
  reorderCategoriesAction,
  setCategoryActiveAction,
} from "@/app/(dashboard)/categories/actions";
import type { CategoryDTO } from "@/lib/services/categories";

export function CategoriesView({ categories }: { categories: CategoryDTO[] }) {
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryDTO | null>(null);
  const [defaultType, setDefaultType] = React.useState<"income" | "expense">("expense");
  const [deleting, setDeleting] = React.useState<CategoryDTO | null>(null);

  const income = categories.filter((category) => category.type === "income");
  const expense = categories.filter((category) => category.type === "expense");

  function openCreate(type: "income" | "expense") {
    setEditing(null);
    setDefaultType(type);
    setDialogOpen(true);
  }

  function openEdit(category: CategoryDTO) {
    setEditing(category);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    const result = await deleteCategoryAction(deleting.id);
    if (result.ok) toast({ title: "Category deleted", description: "Its transactions are now uncategorised.", tone: "success" });
    else toast({ title: "Unable to delete category", description: result.error, tone: "error" });
  }

  async function handleToggle(category: CategoryDTO, isActive: boolean) {
    const result = await setCategoryActiveAction(category.id, isActive);
    if (result.ok) toast({ title: isActive ? "Category enabled" : "Category disabled", tone: "success" });
    else toast({ title: "Unable to update category", description: result.error, tone: "error" });
  }

  async function handleMove(category: CategoryDTO, direction: -1 | 1) {
    const list = (category.type === "income" ? income : expense).map((item) => item.id);
    const index = list.indexOf(category.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    const result = await reorderCategoriesAction(category.type, list);
    if (!result.ok) toast({ title: "Unable to reorder", description: result.error, tone: "error" });
  }

  return (
    <>
      <PageHeader title="Categories" subtitle={`${categories.length} total`} />

      <div className="space-y-6 px-3 pt-4 sm:px-4 lg:px-6">
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Expense categories
            </h2>
            <button
              type="button"
              onClick={() => openCreate("expense")}
              className="-mr-2 inline-flex h-11 items-center rounded-full px-3 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
            >
              + Add
            </button>
          </div>
          {expense.length ? (
            <CategoryList
              categories={expense}
              onEdit={openEdit}
              onDelete={setDeleting}
              onToggleActive={handleToggle}
              onMove={handleMove}
            />
          ) : (
            <div className="rounded-[var(--radius-xl)] border border-dashed border-border">
              <p className="p-6 text-center text-sm text-muted-foreground">No expense categories yet.</p>
            </div>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Income categories
            </h2>
            <button
              type="button"
              onClick={() => openCreate("income")}
              className="-mr-2 inline-flex h-11 items-center rounded-full px-3 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
            >
              + Add
            </button>
          </div>
          {income.length ? (
            <CategoryList
              categories={income}
              onEdit={openEdit}
              onDelete={setDeleting}
              onToggleActive={handleToggle}
              onMove={handleMove}
            />
          ) : (
            <div className="rounded-[var(--radius-xl)] border border-dashed border-border">
              <p className="p-6 text-center text-sm text-muted-foreground">No income categories yet.</p>
            </div>
          )}
        </section>
      </div>

      <button
        type="button"
        aria-label="Add category"
        onClick={() => openCreate("expense")}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_12px_28px_-8px_rgba(0,0,0,0.6)] transition-transform active:scale-95 lg:bottom-8 lg:right-8"
      >
        <Plus className="size-6" strokeWidth={2.4} />
      </button>

      <CategoryDialog
        key={`${dialogOpen ? "open" : "closed"}:${editing?.id ?? "new"}:${defaultType}`}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        category={editing}
        defaultType={defaultType}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={`Delete “${deleting?.name ?? ""}”?`}
        description="Existing transactions will remain but become uncategorised."
        confirmLabel="Delete category"
      />
    </>
  );
}
