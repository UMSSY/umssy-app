"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  captureCompanyCorrectionToken,
  discardCompanyCorrectionToken,
  getCompanyCorrectionTokenSnapshot,
  subscribeCompanyCorrectionToken,
} from "../utils/company-correction-token-store";

export function useCompanyCorrectionToken() {
  const token = useSyncExternalStore(
    subscribeCompanyCorrectionToken,
    getCompanyCorrectionTokenSnapshot,
    () => null,
  );

  useEffect(() => {
    captureCompanyCorrectionToken();
  }, []);

  return { token, discardToken: discardCompanyCorrectionToken };
}
