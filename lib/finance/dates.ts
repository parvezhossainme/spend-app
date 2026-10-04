/**
 * Date helpers.
 *
 * Transaction/transfer dates are treated as calendar dates stored at UTC
 * midnight. To render them consistently on both server and client (regardless
 * of the viewer's timezone) we format via a UTC "wall clock" projection.
 */
import { format } from "date-fns";

export const DEFAULT_TIMEZONE = "Asia/Dhaka";
export const MONTH_PARAM_PATTERN = /^(\d{4})-(\d{2})$/;

/** Shifts an instant so local formatting reflects its UTC calendar values. */
function asUtcWallClock(date: Date): Date {
  return new Date(date.getTime() + date.getTimezoneOffset() * 60_000);
}

export function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function nextMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

/** Half-open range [start, end) covering the month of `date`. */
export function monthBounds(date: Date): { start: Date; end: Date } {
  return { start: monthStart(date), end: nextMonthStart(date) };
}

export function shiftMonth(date: Date, delta: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}

export function parseMonthParam(param: string | undefined | null): Date | null {
  if (!param) return null;
  const match = MONTH_PARAM_PATTERN.exec(param);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

export function toMonthParam(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(date: Date): string {
  return format(asUtcWallClock(date), "MMMM yyyy");
}

/** `Oct 04, Sunday` — the transaction list date-group heading. */
export function formatDayGroup(date: Date): string {
  return format(asUtcWallClock(date), "MMM dd, EEEE");
}

export function formatLongDate(date: Date): string {
  return format(asUtcWallClock(date), "dd MMMM yyyy");
}

export function formatShortDate(date: Date): string {
  return format(asUtcWallClock(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date): string {
  return format(asUtcWallClock(date), "dd MMM yyyy, HH:mm");
}

export function formatIsoDate(date: Date): string {
  return format(asUtcWallClock(date), "yyyy-MM-dd");
}

/** Parses a `yyyy-MM-dd` input value into a UTC-midnight calendar date. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

export function todayInTimeZone(timeZone: string = DEFAULT_TIMEZONE): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  return new Date(Date.UTC(read("year"), read("month") - 1, read("day")));
}

export function currentMonthParam(timeZone: string = DEFAULT_TIMEZONE): string {
  return toMonthParam(todayInTimeZone(timeZone));
}

export function daysInMonth(date: Date): number {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function startOfWeek(date: Date, weekStartsOn = 0): Date {
  const day = date.getUTCDay();
  const diff = (day - weekStartsOn + 7) % 7;
  return addDays(toDateOnly(date), -diff);
}
