import { z } from "zod";
import { currencyCodeSchema, nonNegativeMoney } from "./shared";

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  type: z.enum(["cash", "bank", "card", "mobile_wallet", "savings", "other"]),
  currencyCode: currencyCodeSchema,
  openingBalance: nonNegativeMoney("Opening balance").optional().default("0"),
  description: z.string().trim().max(200, "Description is too long").optional().nullable(),
  icon: z.string().trim().min(1).max(40).default("Wallet"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color")
    .default("#E8D9A0"),
  isActive: z.boolean().optional().default(true),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40, "Name is too long"),
  type: z.enum(["income", "expense"]),
  icon: z.string().trim().min(1).max(40).default("Tag"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color")
    .default("#E8D9A0"),
  isActive: z.boolean().optional().default(true),
});

export const reorderCategoriesSchema = z.object({
  type: z.enum(["income", "expense"]),
  orderedIds: z.array(z.string()).min(1),
});

export const budgetSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  amount: nonNegativeMoney("Budget amount"),
  currencyCode: currencyCodeSchema,
  periodType: z.enum(["weekly", "monthly", "custom"]),
  startDate: z.string().trim().min(1, "Start date is required"),
  endDate: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  categoryIds: z.array(z.string()).default([]),
});

export type AccountInput = z.infer<typeof accountSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
