import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/actions/result";

export type ResetScope = "transactions" | "categories" | "accounts" | "everything";

export const RESET_SCOPE_LABELS: Record<ResetScope, string> = {
  transactions: "Delete all transactions",
  categories: "Delete all categories",
  accounts: "Delete all accounts",
  everything: "Delete everything",
};

/** Deleting everything requires the user to type DELETE, checked server-side. */
export async function resetData(userId: string, scope: ResetScope, confirmation?: string): Promise<void> {
  switch (scope) {
    case "transactions": {
      await prisma.$transaction([
        prisma.transfer.deleteMany({ where: { userId } }),
        prisma.transaction.deleteMany({ where: { userId } }),
      ]);
      return;
    }
    case "categories": {
      await prisma.budgetCategory.deleteMany({ where: { budget: { userId } } });
      await prisma.category.deleteMany({ where: { userId } });
      return;
    }
    case "accounts": {
      const [transactionCount, transferCount] = await Promise.all([
        prisma.transaction.count({ where: { userId } }),
        prisma.transfer.count({ where: { userId } }),
      ]);
      if (transactionCount > 0 || transferCount > 0) {
        throw new DomainError("Delete transactions first, then remove accounts.");
      }
      await prisma.account.deleteMany({ where: { userId } });
      return;
    }
    case "everything": {
      if (confirmation !== "DELETE") {
        throw new DomainError("Type DELETE to confirm.");
      }
      await prisma.$transaction([
        prisma.budgetCategory.deleteMany({ where: { budget: { userId } } }),
        prisma.budget.deleteMany({ where: { userId } }),
        prisma.transfer.deleteMany({ where: { userId } }),
        prisma.transaction.deleteMany({ where: { userId } }),
        prisma.account.deleteMany({ where: { userId } }),
        prisma.category.deleteMany({ where: { userId } }),
      ]);
      return;
    }
    default:
      throw new DomainError("Unknown reset scope.");
  }
}
