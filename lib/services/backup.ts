import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/actions/result";
import { toDisplayString } from "@/lib/finance/money";

export const BACKUP_VERSION = "1.0";

const backupCurrencySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  symbol: z.string().min(1),
  flag: z.string().default(""),
  decimalPlaces: z.coerce.number().int().min(0).max(4).default(2),
  isActive: z.boolean().default(true),
});

const backupAccountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["cash", "bank", "card", "mobile_wallet", "savings", "other"]),
  currencyCode: z.string().min(1),
  openingBalance: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().default("Wallet"),
  color: z.string().default("#E8D9A0"),
  isActive: z.boolean().default(true),
});

const backupCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["income", "expense"]),
  icon: z.string().default("Tag"),
  color: z.string().default("#E8D9A0"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

const backupTransactionSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  type: z.enum(["income", "expense"]),
  amount: z.string(),
  currencyCode: z.string().min(1),
  exchangeRate: z.string().default("1"),
  baseAmount: z.string(),
  transactionDate: z.string(),
  note: z.string().nullable().optional(),
});

const backupTransferSchema = z.object({
  id: z.string().min(1),
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  fromAmount: z.string(),
  fromCurrency: z.string().min(1),
  toAmount: z.string(),
  toCurrency: z.string().min(1),
  exchangeRate: z.string().default("1"),
  transactionDate: z.string(),
  note: z.string().nullable().optional(),
});

const backupBudgetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  amount: z.string(),
  currencyCode: z.string().min(1),
  periodType: z.enum(["weekly", "monthly", "custom"]),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  categoryIds: z.array(z.string()).default([]),
});

export const backupSchema = z.object({
  version: z.string().default(BACKUP_VERSION),
  exportedAt: z.string().optional(),
  profile: z
    .object({
      name: z.string().nullable().optional(),
      email: z.string(),
      defaultCurrency: z.string().default("BDT"),
    })
    .optional(),
  preferences: z
    .object({
      defaultCurrency: z.string().default("BDT"),
      theme: z.enum(["dark", "light", "system"]).default("dark"),
      accentColor: z.string().default("#E8D9A0"),
      dateFormat: z.string().default("dd MMM yyyy"),
      numberFormat: z.string().default("en-US"),
      timezone: z.string().default("Asia/Dhaka"),
      firstDayOfWeek: z.coerce.number().int().default(0),
      language: z.string().default("en"),
      notificationsEnabled: z.boolean().default(true),
      budgetWarningEnabled: z.boolean().default(true),
      monthlySummaryEnabled: z.boolean().default(true),
      largeTransactionEnabled: z.boolean().default(false),
      largeTransactionAmount: z.string().nullable().optional(),
    })
    .optional(),
  currencies: z.array(backupCurrencySchema).default([]),
  accounts: z.array(backupAccountSchema).default([]),
  categories: z.array(backupCategorySchema).default([]),
  transactions: z.array(backupTransactionSchema).default([]),
  transfers: z.array(backupTransferSchema).default([]),
  budgets: z.array(backupBudgetSchema).default([]),
});

export type BackupPayload = z.infer<typeof backupSchema>;

export type BackupPreview = {
  accounts: number;
  categories: number;
  transactions: number;
  transfers: number;
  budgets: number;
  currencies: number;
  hasPreferences: boolean;
};

export async function exportBackup(userId: string): Promise<BackupPayload> {
  const [user, currencies, accounts, categories, transactions, transfers, budgets] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, defaultCurrency: true, preference: true },
    }),
    prisma.currency.findMany(),
    prisma.account.findMany({ where: { userId } }),
    prisma.category.findMany({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId } }),
    prisma.transfer.findMany({ where: { userId } }),
    prisma.budget.findMany({ where: { userId }, include: { categories: true } }),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile: { name: user.name, email: user.email, defaultCurrency: user.defaultCurrency },
    preferences: user.preference
      ? {
          defaultCurrency: user.preference.defaultCurrency,
          theme: user.preference.theme,
          accentColor: user.preference.accentColor,
          dateFormat: user.preference.dateFormat,
          numberFormat: user.preference.numberFormat,
          timezone: user.preference.timezone,
          firstDayOfWeek: user.preference.firstDayOfWeek,
          language: user.preference.language,
          notificationsEnabled: user.preference.notificationsEnabled,
          budgetWarningEnabled: user.preference.budgetWarningEnabled,
          monthlySummaryEnabled: user.preference.monthlySummaryEnabled,
          largeTransactionEnabled: user.preference.largeTransactionEnabled,
          largeTransactionAmount: user.preference.largeTransactionAmount
            ? toDisplayString(user.preference.largeTransactionAmount)
            : null,
        }
      : undefined,
    currencies: currencies.map((currency) => ({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      flag: currency.flag,
      decimalPlaces: currency.decimalPlaces,
      isActive: currency.isActive,
    })),
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      openingBalance: toDisplayString(account.openingBalance),
      description: account.description,
      icon: account.icon,
      color: account.color,
      isActive: account.isActive,
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    })),
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      type: transaction.type,
      amount: toDisplayString(transaction.amount),
      currencyCode: transaction.currencyCode,
      exchangeRate: transaction.exchangeRate.toString(),
      baseAmount: toDisplayString(transaction.baseAmount),
      transactionDate: transaction.transactionDate.toISOString(),
      note: transaction.note,
    })),
    transfers: transfers.map((transfer) => ({
      id: transfer.id,
      fromAccountId: transfer.fromAccountId,
      toAccountId: transfer.toAccountId,
      fromAmount: toDisplayString(transfer.fromAmount),
      fromCurrency: transfer.fromCurrency,
      toAmount: toDisplayString(transfer.toAmount),
      toCurrency: transfer.toCurrency,
      exchangeRate: transfer.exchangeRate.toString(),
      transactionDate: transfer.transactionDate.toISOString(),
      note: transfer.note,
    })),
    budgets: budgets.map((budget) => ({
      id: budget.id,
      name: budget.name,
      amount: toDisplayString(budget.amount),
      currencyCode: budget.currencyCode,
      periodType: budget.periodType,
      startDate: budget.startDate.toISOString(),
      endDate: budget.endDate?.toISOString() ?? null,
      isActive: budget.isActive,
      categoryIds: budget.categories.map((link) => link.categoryId),
    })),
  };
}

/** Parses a candidate backup without touching the database. Throws on invalid input. */
export function previewBackup(raw: unknown): { payload: BackupPayload; preview: BackupPreview } {
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    throw new DomainError("This file is not a valid MyMoney backup.");
  }

  const payload = parsed.data;
  return {
    payload,
    preview: {
      accounts: payload.accounts.length,
      categories: payload.categories.length,
      transactions: payload.transactions.length,
      transfers: payload.transfers.length,
      budgets: payload.budgets.length,
      currencies: payload.currencies.length,
      hasPreferences: Boolean(payload.preferences),
    },
  };
}

export type ImportMode = "merge" | "replace";

export async function importBackup(userId: string, raw: unknown, mode: ImportMode): Promise<BackupPreview> {
  const { payload, preview } = previewBackup(raw);

  await prisma.$transaction(
    async (tx) => {
      if (mode === "replace") {
        await tx.budgetCategory.deleteMany({ where: { budget: { userId } } });
        await tx.budget.deleteMany({ where: { userId } });
        await tx.transfer.deleteMany({ where: { userId } });
        await tx.transaction.deleteMany({ where: { userId } });
        await tx.account.deleteMany({ where: { userId } });
        await tx.category.deleteMany({ where: { userId } });
      }

      for (const currency of payload.currencies) {
        await tx.currency.upsert({
          where: { code: currency.code },
          update: { name: currency.name, symbol: currency.symbol, flag: currency.flag, decimalPlaces: currency.decimalPlaces, isActive: currency.isActive },
          create: currency,
        });
      }

      // Ensure every referenced currency exists so foreign keys hold.
      const requiredCodes = new Set<string>([
        ...payload.accounts.map((account) => account.currencyCode),
        ...payload.transactions.map((transaction) => transaction.currencyCode),
        ...payload.budgets.map((budget) => budget.currencyCode),
      ]);
      const missingCodes = [...requiredCodes].filter(
        (code) => !payload.currencies.some((currency) => currency.code === code),
      );
      const knownCurrencies = await tx.currency.findMany({ where: { code: { in: missingCodes } }, select: { code: true } });
      const known = new Set(knownCurrencies.map((currency) => currency.code));
      for (const code of missingCodes) {
        if (known.has(code)) continue;
        await tx.currency.create({ data: { code, name: code, symbol: code, flag: "" } });
      }

      // ---- Accounts (match by name to avoid duplicate accounts on merge) ----
      const existingAccounts = await tx.account.findMany({ where: { userId }, select: { id: true, name: true } });
      const accountIdMap = new Map<string, string>();
      for (const account of payload.accounts) {
        const match = existingAccounts.find((existing) => existing.name === account.name);
        if (match) {
          accountIdMap.set(account.id, match.id);
          continue;
        }
        const created = await tx.account.create({
          data: {
            userId,
            name: account.name,
            type: account.type,
            currencyCode: account.currencyCode,
            openingBalance: account.openingBalance,
            description: account.description ?? null,
            icon: account.icon,
            color: account.color,
            isActive: account.isActive,
          },
          select: { id: true },
        });
        accountIdMap.set(account.id, created.id);
        existingAccounts.push({ id: created.id, name: account.name });
      }

      // ---- Categories (match by name + type) ----
      const existingCategories = await tx.category.findMany({
        where: { userId },
        select: { id: true, name: true, type: true },
      });
      const categoryIdMap = new Map<string, string>();
      for (const category of payload.categories) {
        const match = existingCategories.find(
          (existing) => existing.name === category.name && existing.type === category.type,
        );
        if (match) {
          categoryIdMap.set(category.id, match.id);
          continue;
        }
        const created = await tx.category.create({
          data: {
            userId,
            name: category.name,
            type: category.type,
            icon: category.icon,
            color: category.color,
            isActive: category.isActive,
            sortOrder: category.sortOrder,
          },
          select: { id: true },
        });
        categoryIdMap.set(category.id, created.id);
        existingCategories.push({ id: created.id, name: category.name, type: category.type });
      }

      // ---- Transactions ----
      const transactionRows = payload.transactions
        .map((transaction) => {
          const accountId = accountIdMap.get(transaction.accountId);
          if (!accountId) return null;
          const mappedCategory = transaction.categoryId ? categoryIdMap.get(transaction.categoryId) ?? null : null;
          return {
            userId,
            accountId,
            categoryId: mappedCategory,
            type: transaction.type,
            amount: transaction.amount,
            currencyCode: transaction.currencyCode,
            exchangeRate: transaction.exchangeRate,
            baseAmount: transaction.baseAmount,
            transactionDate: new Date(transaction.transactionDate),
            note: transaction.note ?? null,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      if (transactionRows.length > 0) {
        await tx.transaction.createMany({ data: transactionRows });
      }

      // ---- Transfers ----
      const transferRows = payload.transfers
        .map((transfer) => {
          const fromAccountId = accountIdMap.get(transfer.fromAccountId);
          const toAccountId = accountIdMap.get(transfer.toAccountId);
          if (!fromAccountId || !toAccountId) return null;
          return {
            userId,
            fromAccountId,
            toAccountId,
            fromAmount: transfer.fromAmount,
            fromCurrency: transfer.fromCurrency,
            toAmount: transfer.toAmount,
            toCurrency: transfer.toCurrency,
            exchangeRate: transfer.exchangeRate,
            transactionDate: new Date(transfer.transactionDate),
            note: transfer.note ?? null,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      if (transferRows.length > 0) {
        await tx.transfer.createMany({ data: transferRows });
      }

      // ---- Budgets ----
      for (const budget of payload.budgets) {
        const created = await tx.budget.create({
          data: {
            userId,
            name: budget.name,
            amount: budget.amount,
            currencyCode: budget.currencyCode,
            periodType: budget.periodType,
            startDate: new Date(budget.startDate),
            endDate: budget.endDate ? new Date(budget.endDate) : null,
            isActive: budget.isActive,
          },
          select: { id: true },
        });
        const categoryIds = budget.categoryIds
          .map((categoryId) => categoryIdMap.get(categoryId))
          .filter((categoryId): categoryId is string => Boolean(categoryId));
        if (categoryIds.length > 0) {
          await tx.budgetCategory.createMany({
            data: categoryIds.map((categoryId) => ({ budgetId: created.id, categoryId })),
          });
        }
      }

      // ---- Preferences ----
      if (payload.preferences) {
        const preferences = payload.preferences;
        await tx.userPreference.upsert({
          where: { userId },
          update: {
            defaultCurrency: preferences.defaultCurrency,
            theme: preferences.theme,
            accentColor: preferences.accentColor,
            dateFormat: preferences.dateFormat,
            numberFormat: preferences.numberFormat,
            timezone: preferences.timezone,
            firstDayOfWeek: preferences.firstDayOfWeek,
            language: preferences.language,
            notificationsEnabled: preferences.notificationsEnabled,
            budgetWarningEnabled: preferences.budgetWarningEnabled,
            monthlySummaryEnabled: preferences.monthlySummaryEnabled,
            largeTransactionEnabled: preferences.largeTransactionEnabled,
            largeTransactionAmount: preferences.largeTransactionAmount ?? null,
          },
          create: {
            userId,
            defaultCurrency: preferences.defaultCurrency,
            theme: preferences.theme,
            accentColor: preferences.accentColor,
            dateFormat: preferences.dateFormat,
            numberFormat: preferences.numberFormat,
            timezone: preferences.timezone,
            firstDayOfWeek: preferences.firstDayOfWeek,
            language: preferences.language,
            notificationsEnabled: preferences.notificationsEnabled,
            budgetWarningEnabled: preferences.budgetWarningEnabled,
            monthlySummaryEnabled: preferences.monthlySummaryEnabled,
            largeTransactionEnabled: preferences.largeTransactionEnabled,
            largeTransactionAmount: preferences.largeTransactionAmount ?? null,
          },
        });
      }
    },
    { timeout: 30_000, maxWait: 10_000 },
  );

  return preview;
}
