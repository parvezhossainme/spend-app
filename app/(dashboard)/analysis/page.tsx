import { requireUser } from "@/lib/auth/session";
import { normalizeSearchParams } from "@/lib/query";
import { todayInTimeZone } from "@/lib/finance/dates";
import { resolveRange } from "@/lib/finance/ranges";
import {
  getAccountAnalysis,
  getCategoryBreakdown,
  getFlowSeries,
  getLargestTransaction,
} from "@/lib/services/analysis";
import { AnalysisView, type AnalysisViewKey } from "@/components/analysis/analysis-view";

export const metadata = { title: "Analysis" };

const VIEWS: AnalysisViewKey[] = ["expense", "income", "expense-flow", "income-flow", "accounts"];

export default async function AnalysisPage({ searchParams }: PageProps<"/analysis">) {
  const user = await requireUser();
  const params = normalizeSearchParams(await searchParams);
  const weekStartsOn = user.preference?.firstDayOfWeek ?? 0;
  const timezone = user.preference?.timezone ?? "Asia/Dhaka";

  const today = todayInTimeZone(timezone);
  const range = resolveRange(params.range, params.from, params.to, today);
  const view = VIEWS.includes(params.view as AnalysisViewKey) ? (params.view as AnalysisViewKey) : "expense";

  const [
    expense,
    income,
    flowDay,
    flowWeek,
    flowMonth,
    accountAnalysis,
    largestExpense,
    largestIncome,
  ] = await Promise.all([
    getCategoryBreakdown(user.id, "expense", range.start, range.end),
    getCategoryBreakdown(user.id, "income", range.start, range.end),
    getFlowSeries(user.id, range.start, range.end, "day", weekStartsOn),
    getFlowSeries(user.id, range.start, range.end, "week", weekStartsOn),
    getFlowSeries(user.id, range.start, range.end, "month", weekStartsOn),
    getAccountAnalysis(user.id),
    getLargestTransaction(user.id, "expense", range.start, range.end),
    getLargestTransaction(user.id, "income", range.start, range.end),
  ]);

  return (
    <AnalysisView
      view={view}
      rangeKey={range.key}
      from={params.from ?? ""}
      to={params.to ?? ""}
      rangeLabel={range.label}
      currency={user.defaultCurrency}
      expense={expense}
      income={income}
      flow={{ day: flowDay, week: flowWeek, month: flowMonth }}
      accounts={accountAnalysis.rows}
      totalBalance={accountAnalysis.totalBalance}
      largestExpense={largestExpense}
      largestIncome={largestIncome}
    />
  );
}
