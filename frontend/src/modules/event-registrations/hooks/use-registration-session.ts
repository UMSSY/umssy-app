"use client";

import { useSyncExternalStore } from "react";
import { getAccessToken, subscribeAccessToken } from "@/shared/services/storage/access-token-storage";

const getServerToken = () => null;

export function useRegistrationSession(): string | null {
  return useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
}
