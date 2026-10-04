import { requireUser } from "@/lib/auth/session";
import { listAccounts } from "@/lib/services/accounts";
import { toDecimal, toDisplayString } from "@/lib/finance/money";
import { AccountsView } from "@/components/accounts/accounts-view";

export const metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id);
  const totalBalance = toDisplayString(
    accounts.reduce((sum, account) => sum.add(toDecimal(account.currentBalance)), toDecimal(0)),
  );

  return <AccountsView accounts={accounts} baseCurrency={user.defaultCurrency} totalBalance={totalBalance} />;
}
