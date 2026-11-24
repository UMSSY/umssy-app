import type { PresentationSummaryCardProps } from "../types/presentation-summary-card-props.types";
import { EditSectionLink } from "./edit-section-link";
import { SectionCard } from "./section-card";

export function PresentationSummaryCard({ profile }: PresentationSummaryCardProps) {
  const headline = (profile.headline ?? "").trim();
  const aboutMe = (profile.aboutMe ?? "").trim();

  return (
    <SectionCard
      title="Presentación profesional"
      action={<EditSectionLink href="/profile/settings#presentation" sectionName="presentación profesional" />}
    >
      <div className="space-y-2">
        {headline && (
          <div>
            <p className="text-sm text-text-secondary">Titular profesional</p>
            <p className="font-semibold break-words text-ink">{headline}</p>
          </div>
        )}
        <p className={aboutMe ? "max-w-prose text-sm leading-7 break-words whitespace-pre-line text-ink-soft" : "max-w-prose text-sm leading-7 text-text-secondary"}>
          {aboutMe || "Cuenta quién eres, en qué te especializas y qué oportunidades laborales te interesan."}
        </p>
      </div>
    </SectionCard>
  );
}
