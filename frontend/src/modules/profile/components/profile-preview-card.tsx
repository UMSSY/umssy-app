import type { ProfilePreviewCardProps } from "../types/profile-preview-card-props.types";
import { getInitials } from "../utils/get-initials";
import { ProfileAvatar } from "./profile-avatar";
import { SectionCard } from "./section-card";

const SECTION_LABEL_CLASS = "mt-5 text-[11px] font-semibold tracking-wide text-text-secondary uppercase";
const SECTION_TEXT_CLASS = "mt-1 text-[13px] break-words whitespace-pre-line text-ink-soft";

export function ProfilePreviewCard({ fullName, presentation }: ProfilePreviewCardProps) {
  const name = fullName.trim() || "Tu nombre";
  const headline = presentation.headline.trim();
  const aboutMe = presentation.aboutMe.trim();
  const opportunities = presentation.interestedOpportunities.trim();

  return (
    <SectionCard title="Así se verá en tu perfil">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <ProfileAvatar label={getInitials(name)} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink">{name}</p>
          <p className="truncate text-[12px] text-text-secondary">
            {headline || "Tu titular profesional"}
          </p>
        </div>
      </div>

      <p className={SECTION_LABEL_CLASS}>Acerca de</p>
      <p className={SECTION_TEXT_CLASS}>
        {aboutMe || "Aquí se mostrará tu presentación una vez que la guardes."}
      </p>

      {opportunities ? (
        <>
          <p className={SECTION_LABEL_CLASS}>Oportunidades que me interesan</p>
          <p className={SECTION_TEXT_CLASS}>{opportunities}</p>
        </>
      ) : null}
    </SectionCard>
  );
}
