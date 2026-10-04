"use client";

import * as React from "react";
import { AlertTriangle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { changePasswordAction } from "@/app/(dashboard)/settings/actions";

export function ChangePasswordForm() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setSaving(true);
    const result = await changePasswordAction({ currentPassword, newPassword, confirmPassword });
    setSaving(false);

    if (!result.ok) {
      if (result.fieldErrors) {
        const flat: Record<string, string> = {};
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.length) flat[key] = messages[0];
        }
        setErrors(flat);
      }
      setFormError(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Password updated", tone: "success" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <FieldError>{errors.currentPassword}</FieldError>
          </div>
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <FieldError>{errors.newPassword}</FieldError>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <FieldError>{errors.confirmPassword}</FieldError>
          </div>

          {formError ? (
            <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--expense)]/30 bg-[var(--expense)]/10 px-3 py-2 text-sm text-expense">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}

          <Button type="submit" loading={saving} className="w-full">
            {!saving ? <KeyRound className="size-4" /> : null}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
