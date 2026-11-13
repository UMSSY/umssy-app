import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OFFLINE_PASSES_TEXTS } from "../constants/offline-passes.constants";

import type { OfflineStatusBannerProps } from "../types/offline-status-banner-props.types";

export function OfflineStatusBanner({ isOnline, lastUpdated, isStale, onRetry }: OfflineStatusBannerProps) {
  const message = isOnline ? OFFLINE_PASSES_TEXTS.failedRefreshBanner : OFFLINE_PASSES_TEXTS.offlineBanner;

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-notice-border bg-notice px-4 py-3 text-sm text-notice-foreground sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <p>
            <span className="font-semibold">{message}</span>
            {lastUpdated ? <span> · {OFFLINE_PASSES_TEXTS.lastUpdated} {lastUpdated}</span> : null}
          </p>
          {isStale ? <p>{OFFLINE_PASSES_TEXTS.staleNotice}</p> : null}
        </div>
      </div>
      {isOnline && onRetry ? (
        <Button variant="outline" size="sm" className="shrink-0" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          {OFFLINE_PASSES_TEXTS.retry}
        </Button>
      ) : null}
    </div>
  );
}
