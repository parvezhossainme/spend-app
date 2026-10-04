import { PageHeader } from "@/components/layout/page-header";
import { BackupPanel } from "@/components/settings/backup-panel";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "Backup & restore" };

export default async function BackupPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Backup & restore" subtitle="JSON export and import" back />
      <div className="px-3 pt-4 sm:px-4 lg:px-6">
        <BackupPanel />
      </div>
    </>
  );
}
