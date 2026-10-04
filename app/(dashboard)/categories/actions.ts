"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/session";
import { actionError, actionOk, toUserMessage, type ActionResult } from "@/lib/actions/result";
import {
  createCategory,
  deleteCategory,
  reorderCategories,
  setCategoryActive,
  updateCategory,
} from "@/lib/services/categories";
import { categorySchema, reorderCategoriesSchema } from "@/lib/validations/finance";

function revalidate() {
  for (const path of ["/categories", "/records", "/analysis", "/budgets"]) revalidatePath(path);
}

export async function createCategoryAction(input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the category details.", parsed.error.flatten().fieldErrors);
    }
    await createCategory(userId, parsed.data);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save category."));
  }
}

export async function updateCategoryAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please check the category details.", parsed.error.flatten().fieldErrors);
    }
    await updateCategory(userId, id, parsed.data);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to save category."));
  }
}

export async function setCategoryActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await setCategoryActive(userId, id, isActive);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to update category."));
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await deleteCategory(userId, id);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to delete category."));
  }
}

export async function reorderCategoriesAction(type: "income" | "expense", orderedIds: string[]): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = reorderCategoriesSchema.safeParse({ type, orderedIds });
    if (!parsed.success) return actionError("Unable to reorder categories.");
    await reorderCategories(userId, parsed.data.type, parsed.data.orderedIds);
    revalidate();
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to reorder categories."));
  }
}
