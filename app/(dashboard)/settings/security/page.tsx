import { LogOut } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/finance/dates";

export const metadata = { title: "Security" };

export default async function SecurityPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Security" subtitle="Password and session" back />

      <div className="space-y-4 px-3 pt-4 sm:px-4 lg:px-6">
        <ChangePasswordForm />

        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            <div className="rounded-[var(--radius-md)] border border-border p-3">
              <p className="text-sm font-medium">Current session</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Signed in · account created {formatDateTime(user.createdAt)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              MyMoney uses stateless, signed session cookies. Signing out clears this device’s session; changing your
              password invalidates other sessions once they expire.
            </p>
            <SignOutButton>
              <LogOut className="size-4" /> Sign out of this device
            </SignOutButton>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
