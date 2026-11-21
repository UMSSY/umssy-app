"use client";

import { COMPANY_PROFILE_LABELS } from "../constants/company-profile.labels";

interface CompanyAboutSectionProps {
  description?: string | null;
}

export function CompanyAboutSection({ description }: CompanyAboutSectionProps) {
  const textToRender =
    description && description.trim().length > 0
      ? description
      : COMPANY_PROFILE_LABELS.emptyDescription;

  return (
    <section
      aria-label={COMPANY_PROFILE_LABELS.aboutTitle}
      className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
    >
      <h2 className="mb-3 text-lg font-semibold text-foreground">
        {COMPANY_PROFILE_LABELS.aboutTitle}
      </h2>
      <div className="max-h-60 min-h-[120px] overflow-y-auto rounded-md border bg-muted/40 p-4">
        <p className="text-sm leading-relaxed break-words whitespace-pre-line text-muted-foreground select-none">
          {textToRender}
        </p>
      </div>
    </section>
  );
}