import { prisma } from "@/lib/db/prisma";
import { toDecimal } from "@/lib/finance/money";
import type { PreferencesInput } from "@/lib/validations/preferences";

/** Returns the user's preference row, creating it on first access. */
export async function ensurePreferences(userId: string) {
  const existing = await prisma.userPreference.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userPreference.create({ data: { userId } });
}

export async function updatePreferences(userId: string, input: PreferencesInput) {
  await ensurePreferences(userId); // ensure the row exists

  const preference = await prisma.userPreference.update({
    where: { userId },
    data: {
      defaultCurrency: input.defaultCurrency,
      theme: input.theme,
      accentColor: input.accentColor,
      dateFormat: input.dateFormat,
      numberFormat: input.numberFormat,
      timezone: input.timezone,
      firstDayOfWeek: input.firstDayOfWeek,
      language: input.language,
      notificationsEnabled: input.notificationsEnabled,
      budgetWarningEnabled: input.budgetWarningEnabled,
      monthlySummaryEnabled: input.monthlySummaryEnabled,
      largeTransactionEnabled: input.largeTransactionEnabled,
      largeTransactionAmount: input.largeTransactionAmount ? toDecimal(input.largeTransactionAmount) : null,
    },
  });

  // Keep the denormalised default currency on the user record in sync.
  await prisma.user.update({ where: { id: userId }, data: { defaultCurrency: input.defaultCurrency } });

  return preference;
}
