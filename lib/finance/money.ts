/**
 * Exact money arithmetic — server-side only (imports Prisma.Decimal).
 *
 * Every mutation converts incoming values to Prisma.Decimal before doing math,
 * so financial values are never routed through IEEE-754 floats.
 */
import { Prisma } from "@prisma/client";

export type MoneyInput = string | number | Prisma.Decimal | { toString(): string };

export const ZERO = new Prisma.Decimal(0);
export const ONE = new Prisma.Decimal(1);

export function toDecimal(value: MoneyInput | null | undefined): Prisma.Decimal {
  if (value === null || value === undefined || value === "") return new Prisma.Decimal(0);
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value.toString());
}

export function toNumber(value: MoneyInput | null | undefined): number {
  return toDecimal(value).toNumber();
}

/** Normalises to the storage precision used across the schema (4 dp). */
export function toStorageString(value: MoneyInput | null | undefined): string {
  return toDecimal(value).toFixed(4);
}

/** Display precision (2 dp) as a plain string. */
export function toDisplayString(value: MoneyInput | null | undefined): string {
  return toDecimal(value).toFixed(2);
}

export function isNegative(value: MoneyInput | null | undefined): boolean {
  return toDecimal(value).isNegative();
}

export function isZero(value: MoneyInput | null | undefined): boolean {
  return toDecimal(value).isZero();
}

export function sumMoney(values: MoneyInput[]): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>((total, value) => total.add(toDecimal(value)), new Prisma.Decimal(0));
}

/**
 * Converts `amount` (expressed in `fromCurrency`) into the base currency using
 * the stored exchange rate, where the rate is defined as:
 *   units of base currency per 1 unit of `fromCurrency`.
 * Same-currency conversions are always rate 1.
 */
export function convertToBase(
  amount: MoneyInput,
  exchangeRate: MoneyInput,
  fromCurrency: string,
  baseCurrency: string,
): Prisma.Decimal {
  const value = toDecimal(amount);
  if (fromCurrency === baseCurrency) return value;
  return value.mul(toDecimal(exchangeRate));
}

/** Percentage of `part` against `total`, clamped to a sane 0–100 range. */
export function percentage(part: MoneyInput, total: MoneyInput): number {
  const whole = toDecimal(total);
  if (whole.isZero()) return 0;
  return toDecimal(part).div(whole).mul(100).toDecimalPlaces(1).toNumber();
}

export function formatForStorage(value: MoneyInput): string {
  return toDecimal(value).toFixed(4);
}
