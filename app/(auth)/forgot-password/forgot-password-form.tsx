"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { requestPasswordReset } from "../actions";

type FormValues = { email: string };

export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    await requestPasswordReset(values);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-card p-6 text-center shadow-[var(--shadow-soft)]">
        <CheckCircle2 className="mx-auto size-8 text-income" />
        <h2 className="mt-3 text-base font-semibold">Check your inbox</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          If an account exists for that email, password reset instructions are on their way.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Note: email delivery is not configured in this environment, so the request is only recorded server-side.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="rounded-[var(--radius-xl)] border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <p className="mb-4 text-sm text-muted-foreground">
          Enter the email linked to your account and we&apos;ll send reset instructions.
        </p>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-5 w-full">
          {!isSubmitting ? <Mail className="size-4" /> : null}
          Send reset instructions
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-[var(--accent)] hover:underline">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </p>
    </form>
  );
}
