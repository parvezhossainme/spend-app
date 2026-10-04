"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { IconPicker } from "@/components/common/icon-picker";
import { categorySchema } from "@/lib/validations/finance";
import { createCategoryAction, updateCategoryAction } from "@/app/(dashboard)/categories/actions";
import type { CategoryDTO } from "@/lib/services/categories";

export function CategoryDialog({
  open,
  onClose,
  category,
  defaultType = "expense",
}: {
  open: boolean;
  onClose: () => void;
  category: CategoryDTO | null;
  defaultType?: "income" | "expense";
}) {
  const toast = useToast();
  const [name, setName] = React.useState(() => category?.name ?? "");
  const [type, setType] = React.useState<"income" | "expense">(() => category?.type ?? defaultType);
  const [icon, setIcon] = React.useState(() => category?.icon ?? "Tag");
  const [color, setColor] = React.useState(() => category?.color ?? "#E8D9A0");
  const [isActive, setIsActive] = React.useState(() => category?.isActive ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = categorySchema.safeParse({ name, type, icon, color, isActive });
    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const [key, messages] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (messages?.length) flat[key] = messages[0];
      }
      setErrors(flat);
      return;
    }

    setSaving(true);
    const result = category
      ? await updateCategoryAction(category.id, parsed.data)
      : await createCategoryAction(parsed.data);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    toast({ title: category ? "Category updated" : "Category created", tone: "success" });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={category ? "Edit category" : "Add category"}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: "expense", label: "Expense", tone: "expense" },
            { value: "income", label: "Income", tone: "income" },
          ]}
        />

        <div>
          <Label htmlFor="category-name">Name</Label>
          <Input
            id="category-name"
            placeholder="e.g. Groceries"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <FieldError>{errors.name}</FieldError>
        </div>

        <IconPicker icon={icon} color={color} onChange={(value) => {
          if (value.icon) setIcon(value.icon);
          if (value.color) setColor(value.color);
        }} />

        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">Disabled categories are hidden when adding entries.</p>
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
            Save category
          </Button>
        </div>
      </form>
    </Modal>
  );
}
