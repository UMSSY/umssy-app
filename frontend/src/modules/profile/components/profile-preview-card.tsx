import { getFullName } from "../utils/profile-format";
import { ProfileAvatar } from "./profile-avatar";
import { SectionCard } from "./section-card";

interface ProfilePreviewCardProps {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  headline: string;
  aboutMe: string;
  interestedOpportunities: string;
}

export function ProfilePreviewCard({
  firstName,
  lastName,
  photoUrl,
  headline,
  aboutMe,
  interestedOpportunities,
}: ProfilePreviewCardProps) {
  return (
    <SectionCard
      title={
        <>
          <span className="lg:hidden">Vista previa del perfil</span>
          <span className="hidden lg:inline">Así se verá en tu perfil</span>
        </>
      }
    >
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <ProfileAvatar firstName={firstName} lastName={lastName} photoUrl={photoUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink lg:text-[13px]">
            {getFullName(firstName, lastName)}
          </p>
          <p className="truncate text-[14px] text-text-secondary lg:text-[12px]">
            {headline.trim() || "Tu titular profesional"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[11px] font-semibold tracking-wide text-text-secondary uppercase">
        Acerca de
      </p>
      <p className="mt-1 text-[13px] whitespace-pre-line break-words text-ink-soft">
        {aboutMe.trim() || "Aquí se mostrará tu presentación una vez que la guardes."}
      </p>

      {interestedOpportunities.trim() ? (
        <>
          <p className="mt-4 text-[11px] font-semibold tracking-wide text-text-secondary uppercase">
            Oportunidades que me interesan
          </p>
          <p className="mt-1 text-[13px] whitespace-pre-line break-words text-ink-soft">
            {interestedOpportunities.trim()}
          </p>
        </>
      ) : null}
    </SectionCard>
  );
}
