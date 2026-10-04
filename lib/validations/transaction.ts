import { z } from "zod";
import { positiveMoney } from "./shared";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: positiveMoney("Amount"),
  accountId: z.string().trim().min(1, "Account is required"),
  categoryId: z.string().trim().optional().nullable(),
  transactionDate: z.string().trim().min(1, "Date is required"),
  note: z.string().trim().max(500, "Note is too long").optional().nullable(),
  exchangeRate: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,8})?$/, "Invalid exchange rate")
    .optional()
    .nullable(),
});

export const transferSchema = z
  .object({
    fromAccountId: z.string().trim().min(1, "Source account is required"),
    toAccountId: z.string().trim().min(1, "Destination account is required"),
    fromAmount: positiveMoney("Amount"),
    toAmount: positiveMoney("Amount"),
    exchangeRate: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,8})?$/, "Invalid exchange rate")
      .optional()
      .nullable(),
    transactionDate: z.string().trim().min(1, "Date is required"),
    note: z.string().trim().max(500, "Note is too long").optional().nullable(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Choose two different accounts",
    path: ["toAccountId"],
  });

export const transactionFilterSchema = z.object({
  query: z.string().trim().optional(),
  type: z.enum(["income", "expense", "transfer", "all"]).optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  currency: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
