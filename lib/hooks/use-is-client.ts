"use client";

import * as React from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the hydration pass, then `true` on the client.
 * Used to defer portal rendering without calling setState inside an effect.
 */
export function useIsClient(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
