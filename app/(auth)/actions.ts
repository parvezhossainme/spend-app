"use server";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { getPreferences } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validations/auth";
import { actionError, actionOk, toUserMessage, type ActionResult } from "@/lib/actions/result";

export async function registerUser(input: unknown): Promise<ActionResult> {
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return actionError("An account with this email already exists.");
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        defaultCurrency: "BDT",
        preference: { create: { defaultCurrency: "BDT" } },
      },
    });

    await getPreferences(user.id);
    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to create your account. Please try again."));
  }
}

/**
 * Password reset request.
 *
 * No SMTP provider is configured in this project, so the request is recorded
 * server-side and a neutral response is always returned (this also avoids
 * leaking which email addresses have accounts).
 */
export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  try {
    const email = typeof input === "object" && input !== null ? (input as { email?: string }).email : undefined;
    if (!email || typeof email !== "string") {
      return actionError("Please enter your email address.");
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
    if (user) {
      console.info(`[password-reset] reset requested for user ${user.id}`);
    }

    return actionOk();
  } catch (error) {
    return actionError(toUserMessage(error, "Unable to process your request. Please try again."));
  }
}
