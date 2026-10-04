import { z } from "zod";
import { currencyCodeSchema } from "./shared";

export const preferencesSchema = z.object({
  defaultCurrency: currencyCodeSchema,
  theme: z.enum(["dark", "light", "system"]),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color"),
  dateFormat: z.string().trim().min(1).max(40),
  numberFormat: z.string().trim().min(1).max(20),
  timezone: z.string().trim().min(1).max(60),
  firstDayOfWeek: z.coerce.number().int().min(0).max(6),
  language: z.string().trim().min(2).max(10),
  notificationsEnabled: z.boolean(),
  budgetWarningEnabled: z.boolean(),
  monthlySummaryEnabled: z.boolean(),
  largeTransactionEnabled: z.boolean(),
  largeTransactionAmount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,4})?$/, "Invalid amount")
    .optional()
    .nullable(),
});

export const resetSchema = z.object({
  scope: z.enum(["transactions", "categories", "accounts", "everything"]),
  confirmation: z.string().optional(),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type ResetInput = z.infer<typeof resetSchema>;
