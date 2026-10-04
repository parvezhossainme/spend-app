import { PageHeader } from "@/components/layout/page-header";
import { ExportPanel } from "@/components/settings/export-panel";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "Export" };

export default async function ExportPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Export report" subtitle="CSV or PDF" back />
      <div className="px-3 pt-4 sm:px-4 lg:px-6">
        <ExportPanel defaultCurrency={user.defaultCurrency} />
      </div>
    </>
  );
}
