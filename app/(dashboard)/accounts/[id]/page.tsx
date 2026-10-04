import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getAccount } from "@/lib/services/accounts";
import { listTransactions } from "@/lib/services/transactions";
import { listTransfers } from "@/lib/services/transfers";
import { AccountDetail } from "@/components/accounts/account-detail";

export default async function AccountDetailPage({ params }: PageProps<"/accounts/[id]">) {
  const { id } = await params;
  const user = await requireUser();

  const account = await getAccount(user.id, id);
  if (!account) notFound();

  const [transactions, transfers] = await Promise.all([
    listTransactions(user.id, { accountId: id, limit: 200 }),
    listTransfers(user.id, { accountId: id }),
  ]);

  return <AccountDetail account={account} transactions={transactions} transfers={transfers} />;
}
