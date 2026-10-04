"use server";

import { revalidatePath } from "next/cache";
import { requireUserId, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { actionError, actionOk, DomainError, toUserMessage, type ActionResult } from "@/lib/actions/result";
import { updatePreferences } from "@/lib/services/preferences";
import { buildExportData, toCsv, type ExportData } from "@/lib/services/export";
import { exportBackup, importBackup, previewBackup, type BackupPreview } from "@/lib/services/backup";
import { resetData, type ResetScope } from "@/lib/services/reset";
import { preferencesSchema, resetSchema } from "@/lib/validations/preferences";
import { changePasswordSchema } from "@/lib/validations/auth";
import { addDays, monthBounds, parseIsoDate, shiftMonth, todayInTimeZone } from "@/lib/finance/dates";

export async function updatePreferencesAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = preferencesSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check your preferences.", parsed.error.flatten().fieldErrors);
    }
    await updatePreferences(userId, parsed.data);
    revalidatePath("/", "layout");
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save preferences."));
  }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the password fields.", parsed.error.flatten().fieldErrors);
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });
    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) throw new DomainError("Your current password is incorrect.");

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });

    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to change your password."));
  }
}

export type ExportScope = "current-month" | "last-month" | "this-year" | "all" | "custom";

export async function buildExportAction(input: {
  scope: ExportScope;
  from?: string;
  to?: string;
}): Promise<ActionResult<ExportData>> {
  try {
    const user = await requireUser();
    const today = todayInTimeZone(user.preference?.timezone ?? "Asia/Dhaka");
    const currentMonth = monthBounds(today).start;

    let from: Date;
    let to: Date;
    let label: string;

    switch (input.scope) {
      case "last-month": {
        const start = shiftMonth(currentMonth, -1);
        from = start;
        to = currentMonth;
        label = "Last month";
        break;
      }
      case "this-year": {
        from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
        to = new Date(Date.UTC(today.getUTCFullYear() + 1, 0, 1));
        label = String(today.getUTCFullYear());
        break;
      }
      case "all": {
        from = new Date(Date.UTC(1970, 0, 1));
        to = new Date(Date.UTC(2999, 0, 1));
        label = "All transactions";
        break;
      }
      case "custom": {
        const parsedFrom = input.from ? parseIsoDate(input.from) : null;
        const parsedTo = input.to ? parseIsoDate(input.to) : null;
        if (!parsedFrom || !parsedTo) throw new DomainError("Choose a valid custom date range.");
        from = parsedFrom;
        to = addDays(parsedTo, 1);
        label = "Custom range";
        break;
      }
      default: {
        const bounds = monthBounds(today);
        from = bounds.start;
        to = bounds.end;
        label = "Current month";
      }
    }

    const data = await buildExportData(user.id, { from, to }, label);
    return actionOk(data);
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to build the export."));
  }
}

export async function buildCsvAction(input: {
  scope: ExportScope;
  from?: string;
  to?: string;
}): Promise<ActionResult<{ csv: string; filename: string }>> {
  const result = await buildExportAction(input);
  if (!result.ok) return result;
  return actionOk({
    csv: toCsv(result.data!),
    filename: `mymoney-${input.scope}-${new Date().toISOString().slice(0, 10)}.csv`,
  });
}

export async function exportBackupAction(): Promise<ActionResult<{ json: string; filename: string }>> {
  try {
    const userId = await requireUserId();
    const payload = await exportBackup(userId);
    return actionOk({
      json: JSON.stringify(payload, null, 2),
      filename: `mymoney-backup-${new Date().toISOString().slice(0, 10)}.json`,
    });
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to create a backup."));
  }
}

export async function previewBackupAction(raw: unknown): Promise<ActionResult<BackupPreview>> {
  try {
    await requireUserId();
    const { preview } = previewBackup(raw);
    return actionOk(preview);
  } catch (error) {
    return actionError(toUserMessage(error, "This file is not a valid MyMoney backup."));
  }
}

export async function importBackupAction(raw: unknown, mode: "merge" | "replace"): Promise<ActionResult<BackupPreview>> {
  try {
    const userId = await requireUserId();
    const preview = await importBackup(userId, raw, mode);
    revalidatePath("/", "layout");
    return actionOk(preview);
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to restore this backup."));
  }
}

export async function resetDataAction(scope: string, confirmation?: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = resetSchema.safeParse({ scope, confirmation });
    if (!parsed.success) return actionError("Unknown reset option.");
    await resetData(userId, parsed.data.scope as ResetScope, parsed.data.confirmation);
    revalidatePath("/", "layout");
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to reset your data."));
  }
}
