"use client";

import { MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { DropdownItem, DropdownMenu } from "@/components/ui/dropdown";
import { IconBadge } from "@/components/common/icon-badge";
import { BudgetProgress } from "./budget-progress";
import type { BudgetDTO } from "@/lib/services/budgets";

export function BudgetCard({
  budget,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  budget: BudgetDTO;
  onEdit: (budget: BudgetDTO) => void;
  onDelete: (budget: BudgetDTO) => void;
  onToggleActive: (budget: BudgetDTO, isActive: boolean) => void;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{budget.name}</p>
            {!budget.isActive ? <Badge tone="muted">Inactive</Badge> : null}
            <Badge tone="muted">{budget.periodLabel}</Badge>
          </div>

          {budget.categories.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {budget.categories.map((category) => (
                <span
                  key={category.id}
                  className="flex items-center gap-1 rounded-full bg-card-elevated px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  <IconBadge name={category.icon} color={category.color} className="size-4" iconClassName="size-2.5" />
                  {category.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              No categories linked — link categories to track spending.
            </p>
          )}
        </div>

        <DropdownMenu trigger={<MoreVertical className="size-4" />}>
          {(close) => (
            <>
              <DropdownItem icon={<Pencil className="size-4" />} onClick={() => { close(); onEdit(budget); }}>
                Edit
              </DropdownItem>
              <DropdownItem
                icon={<Power className="size-4" />}
                onClick={() => { close(); onToggleActive(budget, !budget.isActive); }}
              >
                {budget.isActive ? "Deactivate" : "Activate"}
              </DropdownItem>
              <DropdownItem icon={<Trash2 className="size-4" />} danger onClick={() => { close(); onDelete(budget); }}>
                Delete
              </DropdownItem>
            </>
          )}
        </DropdownMenu>
      </div>

      <div className="mt-4">
        <BudgetProgress budget={budget} />
      </div>
    </div>
  );
}
