import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/actions/result";
import { ensurePreferences } from "@/lib/services/preferences";

export type SessionUser = Prisma.UserGetPayload<{ include: { preference: true } }>;
export type PreferenceRecord = Prisma.UserPreferenceGetPayload<Record<string, never>>;

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** For server actions — never redirects, throws a safe domain error instead. */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new DomainError("Your session has expired. Please sign in again.");
  return userId;
}

/** For pages/layouts — redirects unauthenticated visitors to the login screen. */
export async function requireUser(): Promise<SessionUser> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preference: true },
  });
  if (!user) redirect("/login");
  return user;
}

/** Returns the user's preference row, creating it on first access. */
export async function getPreferences(userId: string): Promise<PreferenceRecord> {
  return ensurePreferences(userId);
}

export async function getPreferencesForUser(): Promise<{ userId: string; preference: PreferenceRecord }> {
  const userId = await requireUserId();
  const preference = await getPreferences(userId);
  return { userId, preference };
}
