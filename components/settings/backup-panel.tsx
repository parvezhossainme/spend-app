"use client";

import * as React from "react";
import { AlertTriangle, Download, RotateCcw, Trash, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  exportBackupAction,
  importBackupAction,
  previewBackupAction,
  resetDataAction,
} from "@/app/(dashboard)/settings/actions";
import type { BackupPreview } from "@/lib/services/backup";

type ResetScope = "transactions" | "categories" | "accounts" | "everything";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function BackupPanel() {
  const toast = useToast();
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [preview, setPreview] = React.useState<BackupPreview | null>(null);
  const [payload, setPayload] = React.useState<unknown>(null);
  const [fileName, setFileName] = React.useState("");
  const [mode, setMode] = React.useState<"merge" | "replace">("merge");
  const [busy, setBusy] = React.useState(false);
  const [confirmImport, setConfirmImport] = React.useState(false);
  const [resetScope, setResetScope] = React.useState<ResetScope | null>(null);

  async function handleBackup() {
    setBusy(true);
    const result = await exportBackupAction();
    setBusy(false);
    if (!result.ok || !result.data) {
      toast({ title: "Unable to create backup", description: result.ok ? undefined : result.error, tone: "error" });
      return;
    }
    download(result.data.filename, result.data.json, "application/json");
    toast({ title: "Backup downloaded", tone: "success" });
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = await previewBackupAction(parsed);
      if (!result.ok || !result.data) {
        toast({ title: "Invalid backup file", description: result.ok ? undefined : result.error, tone: "error" });
        setPreview(null);
        setPayload(null);
        return;
      }
      setPayload(parsed);
      setPreview(result.data);
    } catch {
      toast({ title: "Could not read that file", description: "Make sure it is a MyMoney JSON backup.", tone: "error" });
      setPreview(null);
      setPayload(null);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleImport() {
    if (!payload) return;
    const result = await importBackupAction(payload, mode);
    if (!result.ok) {
      toast({ title: "Restore failed", description: result.error, tone: "error" });
      return;
    }
    toast({ title: "Backup restored", tone: "success" });
    setPreview(null);
    setPayload(null);
    router.refresh();
  }

  async function handleReset() {
    if (!resetScope) return;
    const result = await resetDataAction(resetScope, resetScope === "everything" ? "DELETE" : undefined);
    if (!result.ok) {
      toast({ title: "Reset failed", description: result.error, tone: "error" });
      return;
    }
    toast({ title: "Data deleted", tone: "success" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <p className="text-sm text-muted-foreground">
            Download a JSON file containing your accounts, categories, transactions, transfers, budgets, preferences,
            currencies and exchange rates.
          </p>
          <Button type="button" onClick={handleBackup} loading={busy}>
            {!busy ? <Download className="size-4" /> : null}
            Download backup
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restore</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-3">
          <input ref={inputRef} type="file" accept="application/json,.json" onChange={handleFile} className="hidden" />
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
            <Upload className="size-4" /> Choose backup file
          </Button>

          {preview ? (
            <div className="space-y-3 rounded-[var(--radius-lg)] border border-border p-4">
              <p className="text-sm font-medium">
                Preview {fileName ? <span className="text-muted-foreground">· {fileName}</span> : null}
              </p>
              <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <Stat label="Accounts" value={preview.accounts} />
                <Stat label="Categories" value={preview.categories} />
                <Stat label="Transactions" value={preview.transactions} />
                <Stat label="Transfers" value={preview.transfers} />
                <Stat label="Budgets" value={preview.budgets} />
                <Stat label="Currencies" value={preview.currencies} />
              </dl>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Import mode</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ModeOption
                    active={mode === "merge"}
                    title="Merge"
                    description="Keep existing data and add what’s missing."
                    onClick={() => setMode("merge")}
                  />
                  <ModeOption
                    active={mode === "replace"}
                    title="Replace"
                    description="Delete your current data first, then import."
                    tone="danger"
                    onClick={() => setMode("replace")}
                  />
                </div>
              </div>

              <Button type="button" onClick={() => setConfirmImport(true)} className="w-full">
                <RotateCcw className="size-4" /> Restore this backup
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card id="danger" className="border-[var(--expense)]/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-expense">
            <AlertTriangle className="size-4" /> Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-3">
          <DangerRow
            label="Delete all transactions"
            description="Removes every transaction and transfer."
            onClick={() => setResetScope("transactions")}
          />
          <Separator />
          <DangerRow
            label="Delete all categories"
            description="Transactions become uncategorised."
            onClick={() => setResetScope("categories")}
          />
          <Separator />
          <DangerRow
            label="Delete all accounts"
            description="Only possible when no transactions exist."
            onClick={() => setResetScope("accounts")}
          />
          <Separator />
          <DangerRow
            label="Delete everything"
            description="Accounts, categories, transactions, transfers and budgets."
            onClick={() => setResetScope("everything")}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmImport}
        onClose={() => setConfirmImport(false)}
        onConfirm={handleImport}
        title={mode === "replace" ? "Replace all data?" : "Restore backup?"}
        description={
          mode === "replace"
            ? "Your existing accounts, categories, transactions, transfers and budgets will be deleted before importing."
            : "Missing accounts, categories, transactions, transfers and budgets will be added."
        }
        confirmLabel={mode === "replace" ? "Replace and import" : "Import"}
        tone={mode === "replace" ? "danger" : "primary"}
      />

      <ConfirmDialog
        open={Boolean(resetScope)}
        onClose={() => setResetScope(null)}
        onConfirm={handleReset}
        title={resetLabel(resetScope).title}
        description={resetLabel(resetScope).description}
        confirmLabel={resetLabel(resetScope).action}
        requireText={resetScope === "everything" ? "DELETE" : undefined}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--input)]/50 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="num font-medium">{value}</dd>
    </div>
  );
}

function ModeOption({
  active,
  title,
  description,
  onClick,
  tone = "primary",
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
  tone?: "primary" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[var(--radius-md)] border p-3 text-left transition-colors ${
        active
          ? tone === "danger"
            ? "border-[var(--expense)] bg-[var(--expense)]/10"
            : "border-[var(--accent)] bg-[var(--accent)]/10"
          : "border-border hover:bg-card-elevated"
      }`}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

function DangerRow({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button type="button" variant="danger" size="sm" onClick={onClick}>
        <Trash className="size-4" />
      </Button>
    </div>
  );
}

function resetLabel(scope: ResetScope | null) {
  switch (scope) {
    case "transactions":
      return { title: "Delete all transactions?", description: "Every transaction and transfer will be removed.", action: "Delete transactions" };
    case "categories":
      return { title: "Delete all categories?", description: "Categories will be removed; transactions stay.", action: "Delete categories" };
    case "accounts":
      return { title: "Delete all accounts?", description: "Only accounts without transactions can be removed.", action: "Delete accounts" };
    default:
      return {
        title: "Delete everything?",
        description: "This clears all of your financial data. Type DELETE to confirm.",
        action: "Delete everything",
      };
  }
}
