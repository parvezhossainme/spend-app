import Link from "next/link";
import { ChevronRight, Download, Lock, Palette, Save, Trash } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { APP_VERSION } from "@/lib/nav";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "Settings" };

const LINKS = [
  { href: "/settings/preferences", label: "Preferences", description: "Currency, language, appearance and notifications", icon: Palette },
  { href: "/settings/security", label: "Security", description: "Change your password and review your session", icon: Lock },
  { href: "/settings/export", label: "Export report", description: "Download transactions as CSV or PDF", icon: Download },
  { href: "/settings/backup", label: "Backup & restore", description: "Export or import your MyMoney data", icon: Save },
  { href: "/settings/backup#danger", label: "Delete & reset", description: "Permanently clear financial data", icon: Trash },
];

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Settings" subtitle={user.email} />

      <div className="space-y-4 px-3 pt-4 sm:px-4 lg:px-6">
        <Card className="p-5">
          <p className="text-sm font-semibold">{user.name ?? "Your account"}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            MyMoney v{APP_VERSION} · Default currency {user.defaultCurrency}
          </p>
        </Card>

        <nav className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-card shadow-[var(--shadow-soft)]">
          <ul className="divide-y divide-[var(--border)]">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-card-elevated">
                  <span className="grid size-9 place-items-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                    <link.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{link.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{link.description}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
