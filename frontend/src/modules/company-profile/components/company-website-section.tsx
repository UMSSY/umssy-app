"use client";

import { ExternalLink, Globe } from "lucide-react";
import { COMPANY_PROFILE_LABELS } from "../constants/company-profile.labels";
import { sanitizeExternalWebsiteUrl } from "../services/company-profile.service";

interface CompanyWebsiteSectionProps {
  website?: string | null;
}

export function CompanyWebsiteSection({ website }: CompanyWebsiteSectionProps) {
  const safeUrl = sanitizeExternalWebsiteUrl(website);

  return (
    <section
      aria-label={COMPANY_PROFILE_LABELS.websiteTitle}
      className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
    >
      <h2 className="mb-3 text-lg font-semibold text-foreground">
        {COMPANY_PROFILE_LABELS.websiteTitle}
      </h2>
      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium break-all text-primary underline transition-opacity hover:opacity-80"
        >
          <Globe className="size-4 shrink-0" />
          <span>{safeUrl}</span>
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      ) : (
        <span className="text-sm text-muted-foreground select-none">
          {COMPANY_PROFILE_LABELS.emptyWebsite}
        </span>
      )}
    </section>
  );
}