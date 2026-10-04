"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/session";
import { actionError, actionOk, toUserMessage, type ActionResult } from "@/lib/actions/result";
import {
  createTransaction,
  deleteTransaction,
  duplicateTransaction,
  updateTransaction,
} from "@/lib/services/transactions";
import { createTransfer, deleteTransfer, updateTransfer } from "@/lib/services/transfers";
import { transactionSchema, transferSchema } from "@/lib/validations/transaction";

function revalidateFinancialViews() {
  for (const path of ["/records", "/analysis", "/budgets", "/accounts", "/categories"]) {
    revalidatePath(path);
  }
}

export async function createTransactionAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = transactionSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the transaction details.", parsed.error.flatten().fieldErrors);
    }
    await createTransaction(userId, parsed.data);
    revalidateFinancialViews();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save transaction."));
  }
}

export async function updateTransactionAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = transactionSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the transaction details.", parsed.error.flatten().fieldErrors);
    }
    await updateTransaction(userId, id, parsed.data);
    revalidateFinancialViews();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save transaction."));
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await deleteTransaction(userId, id);
    revalidateFinancialViews();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to delete transaction."));
  }
}

export async function duplicateTransactionAction(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await duplicateTransaction(userId, id);
    revalidateFinancialViews();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to duplicate transaction."));
  }
}

export async function createTransferAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = transferSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the transfer details.", parsed.error.flatten().fieldErrors);
    }
    await createTransfer(userId, parsed.data);
    revalidateFinancialViews();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save transfer."));
  }
}

export async function updateTransferAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = transferSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the transfer details.", parsed.error.flatten().fieldErrors);
    }
    await updateTransfer(userId, id, parsed.data);
    revalidateFinancialViews();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save transfer."));
  }
}

export async function deleteTransferAction(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await deleteTransfer(userId, id);
    revalidateFinancialViews();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to delete transfer."));
  }
}
