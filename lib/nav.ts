import { Calculator, PieChart, Receipt, Tag, Wallet, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/records", label: "Records", icon: Receipt },
  { href: "/analysis", label: "Analysis", icon: PieChart },
  { href: "/budgets", label: "Budgets", icon: Calculator },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Tag },
];

export const APP_VERSION = "1.0.0";

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
