/**
 * Centralised currency system.
 *
 * Pure + client-safe: no database or Prisma imports here.
 * Every money value in the app is formatted through `formatMoney`, so currency
 * symbols, decimal places and grouping live in exactly one place.
 */

export const DEFAULT_CURRENCY = "BDT";

export type CurrencyMeta = {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimalPlaces: number;
};

export const CURRENCIES: readonly CurrencyMeta[] = [
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩", decimalPlaces: 2 },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", decimalPlaces: 2 },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", decimalPlaces: 2 },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", decimalPlaces: 2 },
] as const;

const CURRENCY_MAP = new Map(CURRENCIES.map((currency) => [currency.code, currency]));

export function getCurrency(code: string | null | undefined): CurrencyMeta {
  if (code && CURRENCY_MAP.has(code)) {
    return CURRENCY_MAP.get(code)!;
  }
  return CURRENCY_MAP.get(DEFAULT_CURRENCY)!;
}

export function isSupportedCurrency(code: string): boolean {
  return CURRENCY_MAP.has(code);
}

export function currencyOptions() {
  return CURRENCIES.map((currency) => ({
    value: currency.code,
    label: `${currency.flag} ${currency.code} — ${currency.name}`,
    short: `${currency.symbol} ${currency.code}`,
  }));
}

export type DecimalLike = string | number | { toString(): string };

function toRawString(value: DecimalLike | null | undefined): string {
  if (value === null || value === undefined) return "0";
  if (typeof value === "string") return value.trim() || "0";
  if (typeof value === "number") return Number.isFinite(value) ? value.toString() : "0";
  return value.toString();
}

function groupInteger(integer: string): string {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Formats a decimal string into `1,234.56` style output without ever coercing
 * the value through a floating point number.
 */
export function formatDecimal(value: DecimalLike | null | undefined, decimalPlaces = 2): string {
  let raw = toRawString(value);

  // Defensive: normalise exponential notation produced by raw JS numbers.
  if (/e/i.test(raw)) {
    raw = Number(raw).toFixed(Math.max(decimalPlaces, 2));
  }

  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [integerPartRaw, fractionPartRaw = ""] = unsigned.split(".");
  const integerPart = integerPartRaw === "" ? "0" : integerPartRaw;
  const fractionPart = fractionPartRaw.padEnd(decimalPlaces, "0").slice(0, decimalPlaces);

  const body = decimalPlaces > 0 ? `${groupInteger(integerPart)}.${fractionPart}` : groupInteger(integerPart);
  return `${negative ? "-" : ""}${body}`;
}

/** `formatMoney("20000")` → `৳20,000.00` */
export function formatMoney(value: DecimalLike | null | undefined, code?: string | null): string {
  const currency = getCurrency(code);
  const formatted = formatDecimal(value, currency.decimalPlaces);
  const negative = formatted.startsWith("-");
  const body = negative ? formatted.slice(1) : formatted;
  return `${negative ? "-" : ""}${currency.symbol}${body}`;
}

/** Formats a value that is already expressed in the base currency. */
export function formatBaseMoney(value: DecimalLike | null | undefined, baseCurrency = DEFAULT_CURRENCY): string {
  return formatMoney(value, baseCurrency);
}

export function toNumber(value: DecimalLike | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(toRawString(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Compact axis labels: ৳20k, ৳1.2M */
export function formatCompactMoney(value: DecimalLike | null | undefined, code?: string | null): string {
  const currency = getCurrency(code);
  const numeric = toNumber(value);
  const abs = Math.abs(numeric);
  const sign = numeric < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${currency.symbol}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}${currency.symbol}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${sign}${currency.symbol}${abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2)}`;
}

export function sumDecimalStrings(values: DecimalLike[]): string {
  // Exact integer-cent summation to avoid float drift.
  let totalCents = 0n;
  for (const value of values) {
    const raw = toRawString(value);
    const negative = raw.startsWith("-");
    const unsigned = negative ? raw.slice(1) : raw;
    const [int, frac = ""] = unsigned.split(".");
    const cents = BigInt((int || "0") + frac.padEnd(4, "0").slice(0, 4));
    totalCents += negative ? -cents : cents;
  }
  const sign = totalCents < 0n ? "-" : "";
  const abs = totalCents < 0n ? -totalCents : totalCents;
  const asString = abs.toString().padStart(5, "0");
  return `${sign}${asString.slice(0, -4)}.${asString.slice(-4)}`;
}
