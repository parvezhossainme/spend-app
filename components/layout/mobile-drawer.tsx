"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { createPortal } from "react-dom";
import {
  Download,
  HelpCircle,
  LogOut,
  Mail,
  Save,
  Settings,
  Star,
  ThumbsUp,
  Trash,
  X,
} from "lucide-react";
import { Brand } from "@/components/common/brand";
import { NAV_ITEMS, isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

type DrawerLink = {
  href: string;
  label: string;
  icon: typeof Download;
  danger?: boolean;
};

const MANAGEMENT: DrawerLink[] = [
  { href: "/settings/export", label: "Export Report", icon: Download },
  { href: "/settings/backup", label: "Backup & Restore", icon: Save },
  { href: "/settings/backup#danger", label: "Delete & Reset", icon: Trash, danger: true },
];

const APPLICATION: DrawerLink[] = [
  { href: "/settings/pro", label: "Pro Version", icon: Star },
  { href: "/settings/like", label: "Like MyMoney", icon: ThumbsUp },
  { href: "/settings/help", label: "Help", icon: HelpCircle },
  { href: "/settings/feedback", label: "Feedback", icon: Mail },
];

export function MobileDrawer({
  open,
  onClose,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  userName: string | null;
}) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 animate-fade bg-[var(--overlay)] backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex h-full w-[86%] max-w-xs animate-drawer flex-col border-r border-border bg-surface">
        <div className="flex items-center justify-between px-5 py-5">
          <Brand showVersion />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
          <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preferences
          </p>
          <SidebarLink href="/settings/preferences" label="Preferences" icon={Settings} active={isActivePath(pathname, "/settings/preferences")} onNavigate={onClose} />

          <SectionLabel>Management</SectionLabel>
          {MANAGEMENT.map((item) => (
            <SidebarLink key={item.href} {...item} active={pathname.startsWith(item.href.split("#")[0])} onNavigate={onClose} />
          ))}

          <SectionLabel>Application</SectionLabel>
          {APPLICATION.map((item) => (
            <SidebarLink key={item.href} {...item} active={false} onNavigate={onClose} />
          ))}

          <p className="px-2 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Primary
          </p>
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActivePath(pathname, item.href)} onNavigate={onClose} />
          ))}
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 px-1">
            <p className="truncate text-sm font-medium">{userName ?? "My account"}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-expense"
          >
            <LogOut className="size-[18px]" />
            Sign out
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  danger,
  onNavigate,
}: DrawerLink & { active: boolean; onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-[var(--accent)]/12 font-medium text-[var(--accent)]"
          : danger
            ? "text-muted-foreground hover:bg-[var(--expense)]/10 hover:text-expense"
            : "text-muted-foreground hover:bg-card hover:text-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      {label}
    </Link>
  );
}
