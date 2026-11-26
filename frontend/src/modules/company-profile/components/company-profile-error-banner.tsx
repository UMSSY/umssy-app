import { AlertCircle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { COMPANY_PROFILE_LABELS } from "../constants/company-profile.labels";
import type { CompanyProfileErrorBannerProps } from "../types/company-profile-error-banner-props.types";

export function CompanyProfileErrorBanner({ message, onRetry }: CompanyProfileErrorBannerProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message}</span>
        {onRetry ? (
          <Button type="button" variant="outline" className="max-md:h-11" onClick={onRetry}>
            <RotateCcw aria-hidden="true" />
            {COMPANY_PROFILE_LABELS.retryButton}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
