import { PrismaClient, AccountType, CategoryType, TransactionType, BudgetPeriod, ThemeMode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CURRENCIES = [
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩", decimalPlaces: 2 },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", decimalPlaces: 2 },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", decimalPlaces: 2 },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", decimalPlaces: 2 },
];

const INCOME_CATEGORIES = [
  { name: "Salary", icon: "Wallet", color: "#7FD1A6" },
  { name: "Awards", icon: "Award", color: "#E8D9A0" },
  { name: "Coupons", icon: "Ticket", color: "#E8A87C" },
  { name: "Grants", icon: "Landmark", color: "#9DB4FF" },
  { name: "Lottery", icon: "Dices", color: "#D7A0E8" },
  { name: "Refunds", icon: "RotateCcw", color: "#8ED1D1" },
  { name: "Rental", icon: "Home", color: "#E8C97C" },
  { name: "Sale", icon: "Tag", color: "#F0A6A6" },
];

const EXPENSE_CATEGORIES = [
  { name: "Baby", icon: "Baby", color: "#F3B6C8" },
  { name: "Bills", icon: "Receipt", color: "#E8A87C" },
  { name: "Clothing", icon: "Shirt", color: "#C9A6F0" },
  { name: "Education", icon: "GraduationCap", color: "#9DB4FF" },
  { name: "Electronics", icon: "Smartphone", color: "#8ED1D1" },
  { name: "Entertainment", icon: "Clapperboard", color: "#F0A6D8" },
  { name: "Food", icon: "UtensilsCrossed", color: "#F2B36B" },
  { name: "Health", icon: "HeartPulse", color: "#F09A9A" },
  { name: "Home", icon: "Home", color: "#E8C97C" },
  { name: "Insurance", icon: "ShieldCheck", color: "#9DD3A8" },
  { name: "Internet", icon: "Wifi", color: "#8FB8F0" },
  { name: "Shopping", icon: "ShoppingBag", color: "#E8A0C0" },
  { name: "Transportation", icon: "Bus", color: "#A8C0E8" },
  { name: "Travel", icon: "Plane", color: "#7FD1C4" },
  { name: "Utilities", icon: "Zap", color: "#EDC46B" },
  { name: "Other", icon: "Ellipsis", color: "#B9B39A" },
];

const ACCOUNTS = [
  { name: "Cash", type: AccountType.cash, icon: "Banknote", color: "#8ED1A8", openingBalance: "0" },
  { name: "Bank", type: AccountType.bank, icon: "Landmark", color: "#9DB4FF", openingBalance: "0" },
  { name: "Card", type: AccountType.card, icon: "CreditCard", color: "#E8D9A0", openingBalance: "0" },
];

async function main() {
  console.log("Seeding currencies…");
  for (const currency of CURRENCIES) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: currency,
      create: currency,
    });
  }

  console.log("Seeding demo user…");
  const passwordHash = await bcrypt.hash("phme69", 10);
  const user = await prisma.user.upsert({
    where: { email: "parvezhossainme@gmail.com" },
    update: {},
    create: {
      name: "parvezhossainme",
      email: "parvezhossainme@gmail.com",
      passwordHash,
      defaultCurrency: "BDT",
      preference: {
        create: {
          defaultCurrency: "BDT",
          theme: ThemeMode.dark,
          timezone: "Asia/Dhaka",
          firstDayOfWeek: 0,
          dateFormat: "dd MMM yyyy",
        },
      },
    },
  });

  console.log("Seeding categories…");
  const incomeCats: Record<string, string> = {};
  const expenseCats: Record<string, string> = {};

  for (const [index, category] of INCOME_CATEGORIES.entries()) {
    const created = await prisma.category.upsert({
      where: { userId_name_type: { userId: user.id, name: category.name, type: CategoryType.income } },
      update: { icon: category.icon, color: category.color, sortOrder: index },
      create: { userId: user.id, type: CategoryType.income, sortOrder: index, ...category },
    });
    incomeCats[category.name] = created.id;
  }

  for (const [index, category] of EXPENSE_CATEGORIES.entries()) {
    const created = await prisma.category.upsert({
      where: { userId_name_type: { userId: user.id, name: category.name, type: CategoryType.expense } },
      update: { icon: category.icon, color: category.color, sortOrder: index },
      create: { userId: user.id, type: CategoryType.expense, sortOrder: index, ...category },
    });
    expenseCats[category.name] = created.id;
  }

  console.log("Seeding accounts…");
  const accounts: Record<string, string> = {};
  for (const account of ACCOUNTS) {
    const existing = await prisma.account.findFirst({ where: { userId: user.id, name: account.name } });
    if (existing) {
      accounts[account.name] = existing.id;
      continue;
    }
    const created = await prisma.account.create({
      data: {
        userId: user.id,
        name: account.name,
        type: account.type,
        icon: account.icon,
        color: account.color,
        currencyCode: "BDT",
        openingBalance: account.openingBalance,
      },
    });
    accounts[account.name] = created.id;
  }

  console.log("Seeding sample transaction…");
  const now = new Date();
  const sampleDate = new Date(now.getFullYear(), now.getMonth(), 4, 10, 0, 0);
  const existingTx = await prisma.transaction.findFirst({
    where: { userId: user.id, categoryId: incomeCats["Salary"], note: "Abbu" },
  });
  if (!existingTx) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: accounts["Card"],
        categoryId: incomeCats["Salary"],
        type: TransactionType.income,
        amount: "20000",
        currencyCode: "BDT",
        exchangeRate: "1",
        baseAmount: "20000",
        transactionDate: sampleDate,
        note: "Abbu",
      },
    });
  }

  console.log("Seeding sample budgets…");
  const isEmptyBudget = (await prisma.budget.count({ where: { userId: user.id } })) === 0;
  if (isEmptyBudget) {
    const budgetSpecs = [
      { name: "Food", amount: "8000", category: "Food", startOffset: 0 },
      { name: "Transport", amount: "5000", category: "Transportation", startOffset: 0 },
      { name: "Shopping", amount: "10000", category: "Shopping", startOffset: 0 },
    ];
    for (const spec of budgetSpecs) {
      await prisma.budget.create({
        data: {
          userId: user.id,
          name: spec.name,
          amount: spec.amount,
          currencyCode: "BDT",
          periodType: BudgetPeriod.monthly,
          startDate: new Date(now.getFullYear(), now.getMonth() + spec.startOffset, 1),
          categories: { create: { categoryId: expenseCats[spec.category] } },
        },
      });
    }
  }

  console.log("\n✔ Seed complete.");
  console.log("  Demo login: parvezhossainme@gmail.com / phme69");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
