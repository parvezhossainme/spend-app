"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/session";
import { actionError, actionOk, toUserMessage, type ActionResult } from "@/lib/actions/result";
import { createBudget, deleteBudget, setBudgetActive, updateBudget } from "@/lib/services/budgets";
import { budgetSchema } from "@/lib/validations/finance";

function revalidate() {
  for (const path of ["/budgets", "/analysis", "/records"]) revalidatePath(path);
}

export async function createBudgetAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = budgetSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the budget details.", parsed.error.flatten().fieldErrors);
    }
    await createBudget(userId, parsed.data);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save budget."));
  }
}

export async function updateBudgetAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = budgetSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the budget details.", parsed.error.flatten().fieldErrors);
    }
    await updateBudget(userId, id, parsed.data);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save budget."));
  }
}

export async function setBudgetActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await setBudgetActive(userId, id, isActive);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to update budget."));
  }
}

export async function deleteBudgetAction(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await deleteBudget(userId, id);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to delete budget."));
  }
}
