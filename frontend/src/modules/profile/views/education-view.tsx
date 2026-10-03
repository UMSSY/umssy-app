import { EducationForm } from "../components/education-form";
import { EducationListCard } from "../components/education-list-card";
import { ProfilePageLayout } from "../components/profile-page-layout";
import { TrajectorySteps } from "../components/trajectory-steps";
import { SAMPLE_EDUCATIONS } from "../config/education-samples.config";

export function EducationView() {
  return (
    <ProfilePageLayout
      activeTab="trajectory"
      title="Trayectoria"
      description="Muestra tus estudios, experiencia, habilidades y certificaciones"
    >
      <TrajectorySteps activeStep="education" />
      <div className="grid grid-cols-2 items-start gap-6">
        <EducationListCard educations={SAMPLE_EDUCATIONS} />
        <EducationForm />
      </div>
    </ProfilePageLayout>
  );
}
