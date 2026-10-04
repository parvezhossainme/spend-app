export const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "card", label: "Card" },
  { value: "mobile_wallet", label: "Mobile Wallet" },
  { value: "savings", label: "Savings" },
  { value: "other", label: "Other" },
] as const;

export type AccountTypeValue = (typeof ACCOUNT_TYPES)[number]["value"];

export function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPES.find((option) => option.value === type)?.label ?? "Other";
}

export const DATE_FORMATS = [
  { value: "dd MMM yyyy", label: "04 Oct 2026" },
  { value: "dd MMMM yyyy", label: "04 October 2026" },
  { value: "dd/MM/yyyy", label: "04/10/2026" },
  { value: "MM/dd/yyyy", label: "10/04/2026" },
  { value: "yyyy-MM-dd", label: "2026-10-04" },
] as const;

export const NUMBER_FORMATS = [
  { value: "en-US", label: "1,234.56 (US)" },
  { value: "en-GB", label: "1,234.56 (UK)" },
  { value: "de-DE", label: "1.234,56 (DE)" },
  { value: "en-IN", label: "1,234.56 (IN)" },
  { value: "bn-BD", label: "1,234.56 (BD)" },
] as const;

export const TIMEZONES = [
  { value: "Asia/Dhaka", label: "Asia/Dhaka (UTC+6)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (UTC+5:30)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (UTC+4)" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "UTC", label: "UTC" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা (Bangla)" },
] as const;

export const WEEK_DAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
] as const;
