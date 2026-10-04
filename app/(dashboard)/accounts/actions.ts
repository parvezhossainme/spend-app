"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/session";
import { actionError, actionOk, toUserMessage, type ActionResult } from "@/lib/actions/result";
import { createAccount, deleteAccount, setAccountActive, updateAccount } from "@/lib/services/accounts";
import { accountSchema } from "@/lib/validations/finance";

function revalidate() {
  for (const path of ["/accounts", "/records", "/analysis", "/budgets"]) revalidatePath(path);
}

export async function createAccountAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = accountSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the account details.", parsed.error.flatten().fieldErrors);
    }
    await createAccount(userId, parsed.data);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save account."));
  }
}

export async function updateAccountAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = accountSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the account details.", parsed.error.flatten().fieldErrors);
    }
    await updateAccount(userId, id, parsed.data);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save account."));
  }
}

export async function setAccountActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await setAccountActive(userId, id, isActive);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to update account."));
  }
}

export async function deleteAccountAction(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await deleteAccount(userId, id);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to delete account."));
  }
}
