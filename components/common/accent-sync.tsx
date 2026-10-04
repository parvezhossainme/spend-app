"use client";

import * as React from "react";

/** Applies the user's saved accent colour as the `--accent` CSS variable. */
export function AccentSync({ color }: { color: string }) {
  React.useEffect(() => {
    document.documentElement.style.setProperty("--accent", color);
  }, [color]);

  return null;
}
