"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { Brand } from "@/components/common/brand";
import { NAV_ITEMS, isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: (typeof NAV_ITEMS)[number]["icon"];
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-[var(--accent)]/12 font-medium text-[var(--accent)]"
          : "text-muted-foreground hover:bg-card hover:text-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.4 : 2} />
      {label}
    </Link>
  );
}

export function Sidebar({ userName }: { userName: string | null }) {
  const pathname = usePathname();
  const settingsActive = isActivePath(pathname, "/settings");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
      <Link href="/records" className="px-2">
        <Brand />
      </Link>

      <nav className="mt-7 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} active={isActivePath(pathname, item.href)} />
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
        <NavLink href="/settings" label="Settings" icon={SettingsIcon} active={settingsActive} />
        <div className="mt-1 flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName ?? "My account"}</p>
            <p className="text-xs text-muted-foreground">Signed in</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-expense"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
