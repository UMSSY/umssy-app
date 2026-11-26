import { ExternalLink, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY_PROFILE_LABELS } from "../constants/company-profile.labels";
import type { CompanyWebsiteSectionProps } from "../types/company-website-section-props.types";
import { sanitizeExternalWebsiteUrl } from "../utils/sanitize-external-website-url";

export function CompanyWebsiteSection({ website }: CompanyWebsiteSectionProps) {
  const safeUrl = sanitizeExternalWebsiteUrl(website);

  return (
    <Card aria-label={COMPANY_PROFILE_LABELS.websiteTitle} role="region">
      <CardHeader>
        <CardTitle>{COMPANY_PROFILE_LABELS.websiteTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium break-all text-primary underline transition-opacity hover:opacity-80"
          >
            <Globe className="size-4 shrink-0" aria-hidden="true" />
            <span>{safeUrl}</span>
            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">{COMPANY_PROFILE_LABELS.emptyValue}</span>
        )}
      </CardContent>
    </Card>
  );
}
