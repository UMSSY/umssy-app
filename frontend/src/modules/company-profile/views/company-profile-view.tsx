"use client";

import { PageHeading } from "@/shared/components/layout/page-heading";
import { CompanyProfileDetails } from "../components/company-profile-details";
import { CompanyProfileErrorBanner } from "../components/company-profile-error-banner";
import { CompanyProfileSkeleton } from "../components/company-profile-skeleton";
import { COMPANY_PROFILE_LABELS } from "../constants/company-profile.labels";
import { useCompanyProfile } from "../hooks/use-company-profile";

export function CompanyProfileView() {
  const { profile, status, reload } = useCompanyProfile();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeading title={COMPANY_PROFILE_LABELS.pageTitle} description={COMPANY_PROFILE_LABELS.pageSubtitle} />
      {status === "loading" ? <CompanyProfileSkeleton /> : null}
      {status === "no-company" ? <CompanyProfileErrorBanner message={COMPANY_PROFILE_LABELS.noCompanyMessage} /> : null}
      {status === "error" ? (
        <CompanyProfileErrorBanner message={COMPANY_PROFILE_LABELS.errorMessage} onRetry={reload} />
      ) : null}
      {status === "ready" && profile ? <CompanyProfileDetails profile={profile} /> : null}
    </div>
  );
}
