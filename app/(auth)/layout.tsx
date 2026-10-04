import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Brand } from "@/components/common/brand";
import { getCurrentUserId } from "@/lib/auth/session";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const userId = await getCurrentUserId();
  if (userId) redirect("/records");

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Brand />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Welcome to MyMoney</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track income, expenses and budgets — in your currency.
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
