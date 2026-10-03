import { ContactInfoCard } from "../components/contact-info-card";
import { PresentationSummaryCard } from "../components/presentation-summary-card";
import { ProfileCompletionBanner } from "../components/profile-completion-banner";
import { ProfilePageLayout } from "../components/profile-page-layout";
import { EMPTY_PROFILE_SUMMARY } from "../config/profile-summary-defaults.config";
import type { ProfileOverviewViewProps } from "../types/profile-overview-view-props.types";
import { isProfileComplete } from "../utils/is-profile-complete";

export function ProfileOverviewView({ profile = EMPTY_PROFILE_SUMMARY }: ProfileOverviewViewProps) {
  return (
    <ProfilePageLayout
      title="Mi perfil"
      description="Así ven tu perfil los egresados, mentores y empresas de la comunidad."
    >
      <div className="flex flex-col gap-6">
        {isProfileComplete(profile) ? null : <ProfileCompletionBanner />}
        <ContactInfoCard profile={profile} />
        <PresentationSummaryCard profile={profile} />
      </div>
    </ProfilePageLayout>
  );
}
