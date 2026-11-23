import React from "react";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { MOCK_COMPANY_PROFILE } from "../constants/company-mock.data";
import { COMPANY_PROFILE_LABELS } from "../constants/company-profile.labels";
import type { CompanyProfile, ProfileLoadStatus } from "../types/company-profile.types";
import { CompanyAboutSection } from "../components/company-about-section";
import { CompanyWebsiteSection } from "../components/company-website-section";
import {
  CompanyProfileErrorBanner,
  CompanyProfileSkeleton,
} from "../components/company-profile-states";

interface CompanyProfileViewProps {
  profile: CompanyProfile | null;
  status: ProfileLoadStatus;
  onRetry: () => void;
}

export function CompanyProfileView({
  profile,
  status = "success",
  onRetry,
}: CompanyProfileViewProps) {
  if (status === "loading" || status === "idle") {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <CompanyProfileSkeleton />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <CompanyProfileErrorBanner onRetry={onRetry ?? (() => undefined)} />
      </div>
    );
  }

  const company: CompanyProfile = profile ?? MOCK_COMPANY_PROFILE;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">
          {COMPANY_PROFILE_LABELS.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground select-none">
          {COMPANY_PROFILE_LABELS.pageSubtitle}
        </p>
      </div>

      <section
        aria-label={COMPANY_PROFILE_LABELS.headerAriaLabel}
        className="rounded-xl border border-border bg-white p-6 shadow-sm select-none"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
              <Building2 className="size-7 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {company.name}
              </h2>
              <p className="text-sm text-muted-foreground">{company.sector}</p>
            </div>
          </div>
          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
              Activo (Mock)
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <CompanyAboutSection description={company.description} />
          <CompanyWebsiteSection website={company.website} />
        </div>

        <div
          aria-label={COMPANY_PROFILE_LABELS.contactAriaLabel}
          className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-sm select-none"
        >
          <h3 className="text-base font-semibold text-foreground">
            {COMPANY_PROFILE_LABELS.contactTitle}
          </h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <span className="block font-medium text-foreground">
                  {COMPANY_PROFILE_LABELS.cityLabel}
                </span>
                <span>{company.city}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <span className="block font-medium text-foreground">
                  {COMPANY_PROFILE_LABELS.phoneLabel}
                </span>
                <span>{company.phone}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <span className="block font-medium text-foreground">
                  {COMPANY_PROFILE_LABELS.emailLabel}
                </span>
                <span className="text-primary">{company.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}