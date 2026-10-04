"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Menu, Search } from "lucide-react";
import { Brand } from "@/components/common/brand";
import { useShell } from "@/components/layout/app-shell";
import { SearchDialog } from "@/components/search/search-dialog";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  brand = false,
  search = true,
  back = false,
  actions,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  brand?: boolean;
  search?: boolean;
  back?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const { openDrawer } = useShell();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const iconButton =
    "grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 border-b border-border bg-[var(--background)]/90 backdrop-blur-md",
          className,
        )}
      >
        <div className="flex items-center gap-2 px-3 py-3 sm:px-4 lg:px-6">
          {back ? (
            <button type="button" aria-label="Go back" className={iconButton} onClick={() => router.back()}>
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <button type="button" aria-label="Open menu" className={cn(iconButton, "lg:hidden")} onClick={openDrawer}>
              <Menu className="size-5" />
            </button>
          )}

          <div className="min-w-0 flex-1">
            {brand ? (
              <div className="flex items-center justify-center lg:hidden">
                <Brand />
              </div>
            ) : null}
            <div className={cn("min-w-0", brand && "hidden lg:block")}>
              {title ? <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1> : null}
              {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {actions}
            {search ? (
              <button type="button" aria-label="Search" className={iconButton} onClick={() => setSearchOpen(true)}>
                <Search className="size-5" />
              </button>
            ) : null}
          </div>
        </div>

        {children}
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
