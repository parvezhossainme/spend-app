import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getPreferences, requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const preference = user.preference ?? (await getPreferences(user.id));

  return (
    <AppShell accentColor={preference.accentColor} userName={user.name}>
      {children}
    </AppShell>
  );
}
