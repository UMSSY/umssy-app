"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// false en el render del servidor y true en el navegador. Sirve para leer localStorage
// sin que el HTML del servidor y el del navegador sean distintos.
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
