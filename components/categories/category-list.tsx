"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  MoreVertical,
  Palette,
  Pencil,
  Power,
  Tags,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/card";
import { DropdownItem, DropdownMenu } from "@/components/ui/dropdown";
import { IconBadge } from "@/components/common/icon-badge";
import type { CategoryDTO } from "@/lib/services/categories";

export function CategoryList({
  categories,
  onEdit,
  onDelete,
  onToggleActive,
  onMove,
}: {
  categories: CategoryDTO[];
  onEdit: (category: CategoryDTO, focus?: "name" | "icon" | "color") => void;
  onDelete: (category: CategoryDTO) => void;
  onToggleActive: (category: CategoryDTO, isActive: boolean) => void;
  onMove: (category: CategoryDTO, direction: -1 | 1) => void;
}) {
  return (
    <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-xl)] border border-border bg-card shadow-[var(--shadow-soft)]">
      {categories.map((category, index) => (
        <li key={category.id} className="flex items-center gap-3 px-3 py-3">
          <IconBadge name={category.icon} color={category.color} />
          <button type="button" onClick={() => onEdit(category)} className="min-w-0 flex-1 text-left">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{category.name}</span>
              {!category.isActive ? <Badge tone="muted">Off</Badge> : null}
            </span>
            <span className="text-xs text-muted-foreground">
              {category.transactionCount} entr{category.transactionCount === 1 ? "y" : "ies"}
            </span>
          </button>

          <DropdownMenu trigger={<MoreVertical className="size-4" />}>
            {(close) => (
              <>
                <DropdownItem icon={<Pencil className="size-4" />} onClick={() => { close(); onEdit(category, "name"); }}>
                  Rename
                </DropdownItem>
                <DropdownItem icon={<Tags className="size-4" />} onClick={() => { close(); onEdit(category, "icon"); }}>
                  Change icon
                </DropdownItem>
                <DropdownItem icon={<Palette className="size-4" />} onClick={() => { close(); onEdit(category, "color"); }}>
                  Change colour
                </DropdownItem>
                <DropdownItem
                  icon={<ArrowUp className="size-4" />}
                  onClick={() => { close(); onMove(category, -1); }}
                >
                  Move up
                </DropdownItem>
                <DropdownItem
                  icon={<ArrowDown className="size-4" />}
                  onClick={() => { close(); onMove(category, 1); }}
                >
                  Move down
                </DropdownItem>
                <DropdownItem
                  icon={<Power className="size-4" />}
                  onClick={() => { close(); onToggleActive(category, !category.isActive); }}
                >
                  {category.isActive ? "Disable" : "Enable"}
                </DropdownItem>
                <DropdownItem icon={<Trash2 className="size-4" />} danger onClick={() => { close(); onDelete(category); }}>
                  Delete
                </DropdownItem>
              </>
            )}
          </DropdownMenu>
          <span className="sr-only">{index + 1}</span>
        </li>
      ))}
    </ul>
  );
}
