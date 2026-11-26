import { Skeleton } from "@/components/ui/skeleton";
import { COMPANY_PROFILE_LABELS } from "../constants/company-profile.labels";

export function CompanyProfileSkeleton() {
  return (
    <div aria-label={COMPANY_PROFILE_LABELS.loadingAriaLabel} aria-busy="true" className="space-y-6">
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
