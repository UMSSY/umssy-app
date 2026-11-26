import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY_PROFILE_LABELS } from "../constants/company-profile.labels";
import type { CompanyAboutSectionProps } from "../types/company-about-section-props.types";

export function CompanyAboutSection({ description }: CompanyAboutSectionProps) {
  return (
    <Card aria-label={COMPANY_PROFILE_LABELS.aboutTitle} role="region">
      <CardHeader>
        <CardTitle>{COMPANY_PROFILE_LABELS.aboutTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed wrap-anywhere whitespace-pre-line text-muted-foreground">
          {description ?? COMPANY_PROFILE_LABELS.emptyDescription}
        </p>
      </CardContent>
    </Card>
  );
}
