"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_PROFILE_LABELS } from "../constants/company-profile.labels";

export function CompanyProfileSkeleton() {
  return (
    <div
      aria-label={COMPANY_PROFILE_LABELS.loadingAriaLabel}
      aria-busy="true"
      className="space-y-6"
    >
      <div className="space-y-2">
        <div className="h-8 w-44 animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-40 w-full animate-pulse rounded-lg border bg-muted/60" />
      <div className="h-44 w-full animate-pulse rounded-lg border bg-muted/60" />
      <div className="h-28 w-full animate-pulse rounded-lg border bg-muted/60" />
    </div>
  );
}

interface CompanyProfileErrorBannerProps {
  onRetry: () => void;
}

export function CompanyProfileErrorBanner({ onRetry }: CompanyProfileErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-destructive"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm font-medium">
            {COMPANY_PROFILE_LABELS.errorMessage}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="shrink-0 gap-2 border-destructive/40 bg-background text-foreground hover:bg-muted"
        >
          <RotateCcw className="size-4" />
          <span>{COMPANY_PROFILE_LABELS.retryButton}</span>
        </Button>
      </div>
    </div>
  );
}