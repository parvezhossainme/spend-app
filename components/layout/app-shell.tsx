"use client";

import * as React from "react";
import { AccentSync } from "@/components/common/accent-sync";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { Sidebar } from "@/components/layout/sidebar";

type ShellContextValue = {
  openDrawer: () => void;
  closeDrawer: () => void;
};

const ShellContext = React.createContext<ShellContextValue | null>(null);

export function useShell(): ShellContextValue {
  const context = React.useContext(ShellContext);
  if (!context) throw new Error("useShell must be used within AppShell");
  return context;
}

export function AppShell({
  children,
  accentColor,
  userName,
}: {
  children: React.ReactNode;
  accentColor: string;
  userName: string | null;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const value = React.useMemo<ShellContextValue>(
    () => ({
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [],
  );

  return (
    <ShellContext.Provider value={value}>
      <AccentSync color={accentColor} />
      <div className="min-h-dvh">
        <Sidebar userName={userName} />
        <MobileDrawer open={drawerOpen} onClose={value.closeDrawer} userName={userName} />

        <div className="flex min-h-dvh flex-col lg:pl-[272px]">
          <main className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-8">{children}</main>
          <MobileBottomNav />
        </div>
      </div>
    </ShellContext.Provider>
  );
}
