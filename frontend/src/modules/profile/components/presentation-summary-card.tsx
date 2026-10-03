import type { PresentationSummaryCardProps } from "../types/presentation-summary-card-props.types";
import { EditSectionLink } from "./edit-section-link";
import { SectionCard } from "./section-card";

const SUBTITLE_CLASS = "font-tight text-[15px] font-bold text-ink";
const FILLED_TEXT_CLASS = "mt-1 text-[15px] break-words whitespace-pre-line text-ink-soft";
const EMPTY_TEXT_CLASS = "mt-1 text-[15px] text-text-secondary";

export function PresentationSummaryCard({ profile }: PresentationSummaryCardProps) {
  const aboutMe = profile.aboutMe.trim();
  const opportunities = profile.interestedOpportunities.trim();

  return (
    <SectionCard
      title="Presentación profesional"
      action={<EditSectionLink href="/profile/presentation" sectionName="presentación profesional" />}
    >
      <div className="flex flex-col gap-6">
        <div>
          <h3 className={SUBTITLE_CLASS}>Acerca de</h3>
          <p className={aboutMe ? FILLED_TEXT_CLASS : EMPTY_TEXT_CLASS}>
            {aboutMe || "Cuenta quién eres y en qué te especializas."}
          </p>
        </div>
        <div>
          <h3 className={SUBTITLE_CLASS}>Oportunidades que me interesan</h3>
          <p className={opportunities ? FILLED_TEXT_CLASS : EMPTY_TEXT_CLASS}>
            {opportunities || "Indica qué oportunidades laborales te interesan."}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
