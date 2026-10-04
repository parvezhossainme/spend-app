import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/actions/result";
import type { CategoryInput } from "@/lib/validations/finance";
import type { CategoryType } from "@prisma/client";

export type CategoryDTO = {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  transactionCount: number;
};

export async function listCategories(userId: string, type?: CategoryType): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const counts = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, categoryId: { not: null } },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((row) => [row.categoryId as string, row._count._all]));

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    transactionCount: countMap.get(category.id) ?? 0,
  }));
}

export async function listSelectableCategories(userId: string) {
  const categories = await prisma.category.findMany({
    where: { userId, isActive: true },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, type: true, icon: true, color: true },
  });
  return categories;
}

export async function createCategory(userId: string, input: CategoryInput): Promise<void> {
  const duplicate = await prisma.category.findFirst({
    where: { userId, name: input.name, type: input.type },
    select: { id: true },
  });
  if (duplicate) throw new DomainError(`A ${input.type} category named “${input.name}” already exists.`);

  const last = await prisma.category.findFirst({
    where: { userId, type: input.type },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.category.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      icon: input.icon,
      color: input.color,
      isActive: input.isActive ?? true,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
}

export async function updateCategory(userId: string, id: string, input: CategoryInput): Promise<void> {
  const existing = await prisma.category.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw new DomainError("Category not found.");

  const duplicate = await prisma.category.findFirst({
    where: { userId, name: input.name, type: input.type, id: { not: id } },
    select: { id: true },
  });
  if (duplicate) throw new DomainError(`A ${input.type} category named “${input.name}” already exists.`);

  await prisma.category.update({
    where: { id },
    data: {
      name: input.name,
      type: input.type,
      icon: input.icon,
      color: input.color,
      isActive: input.isActive ?? true,
    },
  });
}

export async function setCategoryActive(userId: string, id: string, isActive: boolean): Promise<void> {
  const result = await prisma.category.updateMany({ where: { id, userId }, data: { isActive } });
  if (result.count === 0) throw new DomainError("Category not found.");
}

/** Deleting a category keeps its transactions — they simply become uncategorised. */
export async function deleteCategory(userId: string, id: string): Promise<void> {
  const result = await prisma.category.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new DomainError("Category not found.");
}

export async function reorderCategories(userId: string, type: CategoryType, orderedIds: string[]): Promise<void> {
  const owned = await prisma.category.findMany({
    where: { userId, type, id: { in: orderedIds } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((category) => category.id));

  await prisma.$transaction(
    orderedIds
      .filter((id) => ownedIds.has(id))
      .map((id, index) => prisma.category.update({ where: { id }, data: { sortOrder: index } })),
  );
}
