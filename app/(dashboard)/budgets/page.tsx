import { requireUser } from "@/lib/auth/session";
import { listBudgets } from "@/lib/services/budgets";
import { listSelectableCategories } from "@/lib/services/categories";
import { BudgetsView } from "@/components/budgets/budgets-view";

export const metadata = { title: "Budgets" };

export default async function BudgetsPage() {
  const user = await requireUser();
  const weekStartsOn = user.preference?.firstDayOfWeek ?? 0;

  const [budgets, categories] = await Promise.all([
    listBudgets(user.id, weekStartsOn),
    listSelectableCategories(user.id),
  ]);

  const expenseCategories = categories.filter((category) => category.type === "expense");

  return (
    <BudgetsView budgets={budgets} categories={expenseCategories} defaultCurrency={user.defaultCurrency} />
  );
}
