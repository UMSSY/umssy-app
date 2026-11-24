"use client";

import { useEffect } from "react";
import {
  registerServiceWorker,
  unregisterServiceWorkers,
} from "@/shared/services/service-worker/service-worker-registration";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") void registerServiceWorker();
    else void unregisterServiceWorkers().catch(() => undefined);
  }, []);

  return null;
}
