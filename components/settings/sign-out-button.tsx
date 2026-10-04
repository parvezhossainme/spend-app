"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ children }: { children: React.ReactNode }) {
  return (
    <Button type="button" variant="danger" onClick={() => signOut({ callbackUrl: "/login" })}>
      {children}
    </Button>
  );
}
