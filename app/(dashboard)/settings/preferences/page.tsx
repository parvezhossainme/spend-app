import { getPreferences, requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { PreferencesForm, type PreferencesFormValues } from "@/components/settings/preferences-form";

export const metadata = { title: "Preferences" };

export default async function PreferencesPage() {
  const user = await requireUser();
  const preference = user.preference ?? (await getPreferences(user.id));

  const initial: PreferencesFormValues = {
    defaultCurrency: preference.defaultCurrency,
    theme: preference.theme,
    accentColor: preference.accentColor,
    dateFormat: preference.dateFormat,
    numberFormat: preference.numberFormat,
    timezone: preference.timezone,
    firstDayOfWeek: preference.firstDayOfWeek,
    language: preference.language,
    notificationsEnabled: preference.notificationsEnabled,
    budgetWarningEnabled: preference.budgetWarningEnabled,
    monthlySummaryEnabled: preference.monthlySummaryEnabled,
    largeTransactionEnabled: preference.largeTransactionEnabled,
    largeTransactionAmount: preference.largeTransactionAmount?.toString() ?? "",
  };

  return (
    <>
      <PageHeader title="Preferences" subtitle="General, appearance and notifications" back />
      <div className="px-3 pt-4 sm:px-4 lg:px-6">
        <PreferencesForm initial={initial} />
      </div>
    </>
  );
}
