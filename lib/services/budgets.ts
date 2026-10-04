import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/actions/result";
import { toDecimal, toDisplayString } from "@/lib/finance/money";
import { addDays, monthStart, nextMonthStart, parseIsoDate, startOfWeek, todayInTimeZone } from "@/lib/finance/dates";
import type { BudgetInput } from "@/lib/validations/finance";
import type { BudgetPeriod } from "@prisma/client";

export type BudgetStatus = "healthy" | "warning" | "exceeded";

export type BudgetDTO = {
  id: string;
  name: string;
  amount: string;
  currencyCode: string;
  periodType: BudgetPeriod;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  categories: { id: string; name: string; icon: string; color: string }[];
  spent: string;
  remaining: string;
  percentage: number;
  status: BudgetStatus;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
};

const STATUS_WARNING_THRESHOLD = 75;

function resolvePeriod(
  budget: { periodType: BudgetPeriod; startDate: Date; endDate: Date | null },
  today: Date,
  weekStartsOn: number,
): { start: Date; end: Date; label: string } {
  if (budget.periodType === "weekly") {
    const start = startOfWeek(today, weekStartsOn);
    return { start, end: addDays(start, 7), label: "This week" };
  }
  if (budget.periodType === "custom") {
    const start = budget.startDate;
    const end = budget.endDate ?? nextMonthStart(start);
    return { start, end, label: "Custom period" };
  }
  return { start: monthStart(today), end: nextMonthStart(today), label: "This month" };
}

export async function listBudgets(userId: string, weekStartsOn = 0): Promise<BudgetDTO[]> {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    include: { categories: { include: { category: true } } },
  });

  const today = todayInTimeZone();

  return Promise.all(
    budgets.map(async (budget) => {
      const { start, end, label } = resolvePeriod(budget, today, weekStartsOn);
      const categoryIds = budget.categories.map((link) => link.categoryId);

      let spent = toDecimal(0);
      if (categoryIds.length > 0 && budget.periodType !== "custom") {
        const aggregate = await prisma.transaction.aggregate({
          where: {
            userId,
            type: "expense",
            categoryId: { in: categoryIds },
            transactionDate: { gte: start, lt: end },
          },
          _sum: { baseAmount: true },
        });
        spent = toDecimal(aggregate._sum.baseAmount ?? 0);
      } else if (categoryIds.length > 0) {
        const aggregate = await prisma.transaction.aggregate({
          where: {
            userId,
            type: "expense",
            categoryId: { in: categoryIds },
            transactionDate: { gte: budget.startDate, lt: budget.endDate ?? nextMonthStart(budget.startDate) },
          },
          _sum: { baseAmount: true },
        });
        spent = toDecimal(aggregate._sum.baseAmount ?? 0);
      }

      const amount = toDecimal(budget.amount);
      const remaining = amount.sub(spent);
      const percentage = amount.isZero() ? 0 : spent.div(amount).mul(100).toDecimalPlaces(1).toNumber();
      const status: BudgetStatus =
        percentage > 100 ? "exceeded" : percentage >= STATUS_WARNING_THRESHOLD ? "warning" : "healthy";

      const dto: BudgetDTO = {
        id: budget.id,
        name: budget.name,
        amount: toDisplayString(amount),
        currencyCode: budget.currencyCode,
        periodType: budget.periodType,
        startDate: budget.startDate.toISOString(),
        endDate: budget.endDate?.toISOString() ?? null,
        isActive: budget.isActive,
        categories: budget.categories.map((link) => ({
          id: link.category.id,
          name: link.category.name,
          icon: link.category.icon,
          color: link.category.color,
        })),
        spent: toDisplayString(spent),
        remaining: toDisplayString(remaining),
        percentage,
        status,
        periodLabel: label,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
      };

      return dto;
    }),
  );
}

async function assertCategoryOwnership(userId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) return;
  const owned = await prisma.category.findMany({
    where: { userId, id: { in: categoryIds }, type: "expense" },
    select: { id: true },
  });
  if (owned.length !== categoryIds.length) throw new DomainError("One or more categories are invalid.");
}

export async function createBudget(userId: string, input: BudgetInput): Promise<void> {
  await assertCategoryOwnership(userId, input.categoryIds);

  const start = parseIsoDate(input.startDate);
  if (!start) throw new DomainError("Invalid budget start date.");
  const end = input.endDate ? parseIsoDate(input.endDate) : null;
  if (input.endDate && !end) throw new DomainError("Invalid budget end date.");
  if (end && end < start) throw new DomainError("End date must be after the start date.");

  await prisma.budget.create({
    data: {
      userId,
      name: input.name,
      amount: toDecimal(input.amount),
      currencyCode: input.currencyCode,
      periodType: input.periodType,
      startDate: start,
      endDate: end,
      isActive: input.isActive ?? true,
      categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });
}

export async function updateBudget(userId: string, id: string, input: BudgetInput): Promise<void> {
  const existing = await prisma.budget.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw new DomainError("Budget not found.");

  await assertCategoryOwnership(userId, input.categoryIds);

  const start = parseIsoDate(input.startDate);
  if (!start) throw new DomainError("Invalid budget start date.");
  const end = input.endDate ? parseIsoDate(input.endDate) : null;
  if (input.endDate && !end) throw new DomainError("Invalid budget end date.");
  if (end && end < start) throw new DomainError("End date must be after the start date.");

  await prisma.$transaction([
    prisma.budgetCategory.deleteMany({ where: { budgetId: id } }),
    prisma.budget.update({
      where: { id },
      data: {
        name: input.name,
        amount: toDecimal(input.amount),
        currencyCode: input.currencyCode,
        periodType: input.periodType,
        startDate: start,
        endDate: end,
        isActive: input.isActive ?? true,
        categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
      },
    }),
  ]);
}

export async function setBudgetActive(userId: string, id: string, isActive: boolean): Promise<void> {
  const result = await prisma.budget.updateMany({ where: { id, userId }, data: { isActive } });
  if (result.count === 0) throw new DomainError("Budget not found.");
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  const result = await prisma.budget.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new DomainError("Budget not found.");
}
