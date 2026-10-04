"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  requireText,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  requireText?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <ConfirmBody
        tone={tone}
        requireText={requireText}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    </Modal>
  );
}

/** Mounted only while the dialog is open, so its state resets on each open. */
function ConfirmBody({
  tone,
  requireText,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}: {
  tone: "danger" | "primary";
  requireText?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const canConfirm = !requireText || value.trim() === requireText;

  async function handleConfirm() {
    if (!canConfirm) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-[var(--input)]/50 p-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-sm text-muted-foreground">
          {tone === "danger" ? "This action cannot be undone." : "Please confirm you want to continue."}
        </p>
      </div>

      {requireText ? (
        <div>
          <Label htmlFor="confirm-text">
            Type <span className="font-mono text-foreground">{requireText}</span> to confirm
          </Label>
          <Input
            id="confirm-text"
            value={value}
            autoComplete="off"
            onChange={(event) => setValue(event.target.value)}
            placeholder={requireText}
          />
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={handleConfirm}
          loading={busy}
          disabled={!canConfirm}
          className="flex-1"
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
