"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/currency";
import { buildCsvAction, buildExportAction, type ExportScope } from "@/app/(dashboard)/settings/actions";
import type { ExportData } from "@/lib/services/export";

const SCOPES: { value: ExportScope; label: string }[] = [
  { value: "current-month", label: "Current month" },
  { value: "last-month", label: "Last month" },
  { value: "this-year", label: "This year" },
  { value: "all", label: "All transactions" },
  { value: "custom", label: "Custom date range" },
];

function download(filename: string, content: BlobPart, type: string) {
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

export function ExportPanel({ defaultCurrency }: { defaultCurrency: string }) {
  const toast = useToast();
  const [scope, setScope] = React.useState<ExportScope>("current-month");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [preview, setPreview] = React.useState<ExportData | null>(null);
  const [busy, setBusy] = React.useState<"csv" | "pdf" | null>(null);

  const input = { scope, from: from || undefined, to: to || undefined };

  async function exportCsv() {
    setBusy("csv");
    const result = await buildCsvAction(input);
    setBusy(null);
    if (!result.ok || !result.data) {
      toast({ title: "Unable to export", description: result.ok ? undefined : result.error, tone: "error" });
      return;
    }
    download(result.data.filename, result.data.csv, "text/csv;charset=utf-8");
    toast({ title: "CSV downloaded", tone: "success" });
  }

  async function exportPdf() {
    setBusy("pdf");
    const result = await buildExportAction(input);
    if (!result.ok || !result.data) {
      setBusy(null);
      toast({ title: "Unable to export", description: result.ok ? undefined : result.error, tone: "error" });
      return;
    }

    const data = result.data;
    setPreview(data);

    const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const autoTable = autoTableModule.default;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    doc.setFontSize(16);
    doc.text("MyMoney — Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`${data.summary.label} · Generated ${data.generatedAt}`, 40, 58);

    doc.setFontSize(11);
    doc.text(
      `Income: ${formatMoney(data.summary.income, defaultCurrency)}    Expense: ${formatMoney(
        data.summary.expense,
        defaultCurrency,
      )}    Net: ${formatMoney(data.summary.net, defaultCurrency)}`,
      40,
      78,
    );

    autoTable(doc, {
      startY: 94,
      head: [["Date", "Type", "Category", "Account", "Amount", "Currency", "Note"]],
      body: data.rows.map((row) => [row.date, row.type, row.category, row.account, row.amount, row.currency, row.note]),
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [232, 217, 160], textColor: [26, 29, 26] },
      alternateRowStyles: { fillColor: [246, 244, 236] },
    });

    doc.save(`mymoney-${scope}-${new Date().toISOString().slice(0, 10)}.pdf`);
    setBusy(null);
    toast({ title: "PDF downloaded", description: `${data.rows.length} rows`, tone: "success" });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Report options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-3">
          <div>
            <Label htmlFor="export-scope">Date range</Label>
            <Select id="export-scope" value={scope} onChange={(event) => setScope(event.target.value as ExportScope)}>
              {SCOPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {scope === "custom" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="export-from">From</Label>
                <Input id="export-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </div>
              <div>
                <Label htmlFor="export-to">To</Label>
                <Input id="export-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </div>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Columns: Date, Type, Category, Account, Amount, Currency, Note — plus a total income, total expense and net
            balance summary.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={exportCsv} loading={busy === "csv"} className="flex-1">
              {busy !== "csv" ? <FileSpreadsheet className="size-4" /> : null}
              Export CSV
            </Button>
            <Button type="button" onClick={exportPdf} loading={busy === "pdf"} className="flex-1">
              {busy !== "pdf" ? <FileText className="size-4" /> : null}
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Last export</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Rows</dt>
                <dd className="num font-medium">{preview.summary.count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Income</dt>
                <dd className="font-medium text-income">{formatMoney(preview.summary.income, preview.summary.currency)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Expense</dt>
                <dd className="font-medium text-expense">{formatMoney(preview.summary.expense, preview.summary.currency)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Net</dt>
                <dd className="font-medium">{formatMoney(preview.summary.net, preview.summary.currency)}</dd>
              </div>
            </dl>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Download className="size-3.5" /> {preview.summary.label} · {preview.generatedAt}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
