import { z } from "zod";

const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

/** A positive money value, kept as a string so precision is never lost. */
export function positiveMoney(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(DECIMAL_PATTERN, `Invalid ${label.toLowerCase()}`)
    .refine((value) => !/^0+(\.0+)?$/.test(value), `${label} must be greater than zero`);
}

/** A money value that may be zero (used for opening balances). */
export function nonNegativeMoney(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(DECIMAL_PATTERN, `Invalid ${label.toLowerCase()}`);
}

export const currencyCodeSchema = z.string().trim().toUpperCase().pipe(z.enum(["BDT", "USD", "EUR", "GBP"]));
