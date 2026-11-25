"use client";

import { useSyncExternalStore } from "react";
import {
  hasCookieSession,
  subscribeCookieSession,
} from "@/shared/services/storage/cookie-session-state";

const getServerCookieSession = () => false;

export function useCookieSession(): boolean {
  return useSyncExternalStore(
    subscribeCookieSession,
    hasCookieSession,
    getServerCookieSession,
  );
}
