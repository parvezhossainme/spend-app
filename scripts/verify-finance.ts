/**
 * MyMoney — data-layer verification.
 *
 * Exercises the real service layer against the real database and asserts the
 * financial rules from the spec. Creates throwaway users and cleans them up,
 * so it is safe to run against a development database:
 *
 *   npm run verify:data
 *
 * Exits non-zero if any assertion fails.
 */
import { PrismaClient } from "@prisma/client";
import { createTransaction, deleteTransaction, getMonthSummary, updateTransaction } from "@/lib/services/transactions";
import { createTransfer, deleteTransfer } from "@/lib/services/transfers";
import { createAccount, computeAccountBalances } from "@/lib/services/accounts";
import { createBudget } from "@/lib/services/budgets";
import { createCategory } from "@/lib/services/categories";
import { getCategoryBreakdown } from "@/lib/services/analysis";
import { updatePreferences } from "@/lib/services/preferences";
import { exportBackup, importBackup, previewBackup } from "@/lib/services/backup";
import { buildExportData, toCsv } from "@/lib/services/export";
import { resetData } from "@/lib/services/reset";
import { formatIsoDate, monthBounds, todayInTimeZone } from "@/lib/finance/dates";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = String(actual) === String(expected);
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  (got ${actual}, expected ${expected})`}`);
}

async function verifyFinancialRules() {
  console.log("\nFinancial rules");
  const user = await prisma.user.create({
    data: { name: "Verify", email: `verify-${Date.now()}@mymoney.test`, passwordHash: "x", defaultCurrency: "BDT" },
  });

  try {
    const isoDate = formatIsoDate(todayInTimeZone());
    const { start, end } = monthBounds(todayInTimeZone());

    await createCategory(user.id, { name: "Food", type: "expense", icon: "Utensils", color: "#F2B36B", isActive: true });
    await createCategory(user.id, { name: "Salary", type: "income", icon: "Wallet", color: "#7FD1A6", isActive: true });
    await createAccount(user.id, { name: "Cash", type: "cash", currencyCode: "BDT", openingBalance: "1000", description: null, icon: "Banknote", color: "#8ED1A8", isActive: true });
    await createAccount(user.id, { name: "Card", type: "card", currencyCode: "BDT", openingBalance: "0", description: null, icon: "CreditCard", color: "#E8D9A0", isActive: true });
    await createAccount(user.id, { name: "USD Wallet", type: "mobile_wallet", currencyCode: "USD", openingBalance: "0", description: null, icon: "Smartphone", color: "#9DB4FF", isActive: true });

    const categories = await prisma.category.findMany({ where: { userId: user.id } });
    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const food = categories.find((c) => c.name === "Food")!;
    const salary = categories.find((c) => c.name === "Salary")!;
    const cash = accounts.find((a) => a.name === "Cash")!;
    const card = accounts.find((a) => a.name === "Card")!;
    const usd = accounts.find((a) => a.name === "USD Wallet")!;

    const balanceOf = async (id: string) =>
      (await computeAccountBalances(user.id)).find((row) => row.account.id === id)!.dto.currentBalance;

    const expense = await createTransaction(user.id, {
      type: "expense", amount: "500", accountId: cash.id, categoryId: food.id,
      transactionDate: isoDate, note: "Groceries", exchangeRate: null,
    });
    check("expense decreases the account balance", await balanceOf(cash.id), "500.00");

    const income = await createTransaction(user.id, {
      type: "income", amount: "2000", accountId: card.id, categoryId: salary.id,
      transactionDate: isoDate, note: "Pay", exchangeRate: null,
    });
    check("income increases the account balance", await balanceOf(card.id), "2000.00");

    let summary = await getMonthSummary(user.id, start, end);
    check("monthly income total", summary.income, "2000.00");
    check("monthly expense total", summary.expense, "500.00");
    check("monthly total = income − expense", summary.total, "1500.00");

    const transfer = await createTransfer(user.id, {
      fromAccountId: cash.id, toAccountId: card.id, fromAmount: "200", toAmount: "200",
      exchangeRate: null, transactionDate: isoDate, note: "Top-up",
    });
    check("transfer debits the source account", await balanceOf(cash.id), "300.00");
    check("transfer credits the destination account", await balanceOf(card.id), "2200.00");
    summary = await getMonthSummary(user.id, start, end);
    check("transfer does not count as income", summary.income, "2000.00");
    check("transfer does not count as expense", summary.expense, "500.00");

    await createTransfer(user.id, {
      fromAccountId: usd.id, toAccountId: cash.id, fromAmount: "10", toAmount: "1200",
      exchangeRate: "120", transactionDate: isoDate, note: "FX",
    });
    check("cross-currency transfer debits source currency", await balanceOf(usd.id), "-10.00");
    check("cross-currency transfer credits destination amount", await balanceOf(cash.id), "1500.00");

    let rejected = false;
    try {
      await createTransaction(user.id, {
        type: "expense", amount: "5", accountId: usd.id, categoryId: food.id,
        transactionDate: isoDate, note: null, exchangeRate: null,
      });
    } catch (error) {
      rejected = error instanceof Error && error.message.includes("conversion rate missing");
    }
    check("cross-currency transaction without a rate is rejected", rejected, true);

    const breakdown = await getCategoryBreakdown(user.id, "expense", start, end);
    check("expense breakdown totals in the base currency", breakdown.total, "500.00");
    check("expense breakdown groups by category", breakdown.items[0]?.name, "Food");
    check("expense breakdown percentage", breakdown.items[0]?.percentage, "100");

    await updateTransaction(user.id, expense.id, {
      type: "expense", amount: "750", accountId: cash.id, categoryId: food.id,
      transactionDate: isoDate, note: "Groceries", exchangeRate: null,
    });
    check("editing an amount adjusts the balance", await balanceOf(cash.id), "1250.00");

    await deleteTransaction(user.id, expense.id);
    check("deleting an expense adjusts the balance", await balanceOf(cash.id), "2000.00");
    summary = await getMonthSummary(user.id, start, end);
    check("deleted expense leaves the monthly total", summary.expense, "0.00");

    const other = await prisma.user.create({
      data: { name: "Other", email: `other-${Date.now()}@mymoney.test`, passwordHash: "x" },
    });
    let blocked = false;
    try {
      await deleteTransaction(other.id, income.id);
    } catch {
      blocked = true;
    }
    check("another user cannot delete this transaction", blocked, true);
    check("transaction survives the foreign delete attempt", await prisma.transaction.count({ where: { id: income.id } }), 1);

    await prisma.user.delete({ where: { id: other.id } });
    await deleteTransfer(user.id, transfer.id);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function verifyDataTools() {
  console.log("\nBackup, restore, export and reset");
  const stamp = Date.now();
  const userA = await prisma.user.create({ data: { name: "A", email: `bk-a-${stamp}@mymoney.test`, passwordHash: "x" } });
  const userB = await prisma.user.create({ data: { name: "B", email: `bk-b-${stamp}@mymoney.test`, passwordHash: "x" } });

  try {
    const isoDate = formatIsoDate(todayInTimeZone());
    const { start, end } = monthBounds(todayInTimeZone());

    await updatePreferences(userA.id, {
      defaultCurrency: "BDT", theme: "dark", accentColor: "#E8D9A0", dateFormat: "dd MMM yyyy",
      numberFormat: "en-US", timezone: "Asia/Dhaka", firstDayOfWeek: 0, language: "en",
      notificationsEnabled: true, budgetWarningEnabled: true, monthlySummaryEnabled: true,
      largeTransactionEnabled: false, largeTransactionAmount: null,
    });
    await createCategory(userA.id, { name: "Food", type: "expense", icon: "Utensils", color: "#F2B36B", isActive: true });
    await createCategory(userA.id, { name: "Salary", type: "income", icon: "Wallet", color: "#7FD1A6", isActive: true });
    await createAccount(userA.id, { name: "Cash", type: "cash", currencyCode: "BDT", openingBalance: "1000", description: null, icon: "Banknote", color: "#8ED1A8", isActive: true });
    await createAccount(userA.id, { name: "Bank", type: "bank", currencyCode: "BDT", openingBalance: "5000", description: null, icon: "Landmark", color: "#9DB4FF", isActive: true });

    const accounts = await prisma.account.findMany({ where: { userId: userA.id } });
    const categories = await prisma.category.findMany({ where: { userId: userA.id } });
    const cash = accounts.find((a) => a.name === "Cash")!;
    const bank = accounts.find((a) => a.name === "Bank")!;
    const food = categories.find((c) => c.name === "Food")!;
    const salary = categories.find((c) => c.name === "Salary")!;

    await createTransaction(userA.id, { type: "expense", amount: "250", accountId: cash.id, categoryId: food.id, transactionDate: isoDate, note: "Lunch", exchangeRate: null });
    await createTransaction(userA.id, { type: "income", amount: "30000", accountId: bank.id, categoryId: salary.id, transactionDate: isoDate, note: "Pay", exchangeRate: null });
    await createTransfer(userA.id, { fromAccountId: bank.id, toAccountId: cash.id, fromAmount: "1000", toAmount: "1000", exchangeRate: null, transactionDate: isoDate, note: null });
    await createBudget(userA.id, { name: "Food", amount: "8000", currencyCode: "BDT", periodType: "monthly", startDate: isoDate, endDate: null, isActive: true, categoryIds: [food.id] });

    const payload = await exportBackup(userA.id);
    check("backup contains accounts", payload.accounts.length, 2);
    check("backup contains categories", payload.categories.length, 2);
    check("backup contains transactions", payload.transactions.length, 2);
    check("backup contains transfers", payload.transfers.length, 1);
    check("backup contains budgets", payload.budgets.length, 1);
    check("backup contains preferences", Boolean(payload.preferences), true);
    check("backup never contains the password hash", JSON.stringify(payload).includes("passwordHash"), false);

    const { preview } = previewBackup(JSON.parse(JSON.stringify(payload)));
    check("preview counts transactions", preview.transactions, 2);

    let invalidRejected = false;
    try {
      previewBackup({ accounts: "nope" });
    } catch {
      invalidRejected = true;
    }
    check("malformed backup files are rejected", invalidRejected, true);

    await importBackup(userB.id, JSON.parse(JSON.stringify(payload)), "merge");
    const restored = await computeAccountBalances(userB.id);
    check("restore recreates accounts", restored.length, 2);
    check(
      "restored balances match the source",
      restored.find((row) => row.account.name === "Cash")!.dto.currentBalance,
      "1750.00",
    );
    check(
      "restored income matches the source",
      restored.find((row) => row.account.name === "Bank")!.dto.currentBalance,
      "34000.00",
    );
    check("restore recreates transactions", await prisma.transaction.count({ where: { userId: userB.id } }), 2);
    check("restore recreates transfers", await prisma.transfer.count({ where: { userId: userB.id } }), 1);
    check("restore recreates budgets", await prisma.budget.count({ where: { userId: userB.id } }), 1);
    check("restore relinks budget categories", await prisma.budgetCategory.count({ where: { budget: { userId: userB.id } } }), 1);

    await importBackup(userB.id, JSON.parse(JSON.stringify(payload)), "replace");
    check("replace mode does not duplicate rows", await prisma.transaction.count({ where: { userId: userB.id } }), 2);

    const exportData = await buildExportData(userA.id, { from: start, to: end }, "This month");
    check("export includes transactions and transfers", exportData.rows.length, 3);
    check("export total income", exportData.summary.income, "30000.00");
    check("export total expense", exportData.summary.expense, "250.00");
    check("export net balance", exportData.summary.net, "29750.00");
    const csv = toCsv(exportData);
    check("csv header", csv.startsWith('"Date","Type","Category","Account","Amount","Currency","Note"'), true);
    check("csv summary rows", csv.includes('"Net balance","29750.00","BDT"'), true);

    let wrongConfirmationRejected = false;
    try {
      await resetData(userB.id, "everything", "delete");
    } catch {
      wrongConfirmationRejected = true;
    }
    check("delete-everything requires exact DELETE confirmation", wrongConfirmationRejected, true);

    await resetData(userB.id, "everything", "DELETE");
    check("reset clears transactions", await prisma.transaction.count({ where: { userId: userB.id } }), 0);
    check("reset clears accounts", await prisma.account.count({ where: { userId: userB.id } }), 0);
    check("reset keeps the user account", await prisma.user.count({ where: { id: userB.id } }), 1);

    await resetData(userA.id, "transactions");
    check("scoped reset clears transactions", await prisma.transaction.count({ where: { userId: userA.id } }), 0);
    check("scoped reset keeps accounts", await prisma.account.count({ where: { userId: userA.id } }), 2);
  } finally {
    await prisma.user.delete({ where: { id: userA.id } });
    await prisma.user.delete({ where: { id: userB.id } });
  }
}

async function main() {
  await verifyFinancialRules();
  await verifyDataTools();

  console.log(`\n${failed === 0 ? "✔ ALL PASSED" : "✖ FAILURES"} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
