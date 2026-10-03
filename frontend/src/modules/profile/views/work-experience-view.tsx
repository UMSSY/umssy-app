import { ProfilePageLayout } from "../components/profile-page-layout";
import { TrajectorySteps } from "../components/trajectory-steps";
import { WorkExperienceListCard } from "../components/work-experience-list-card";
import { SAMPLE_WORK_EXPERIENCES } from "../config/work-experience-samples.config";

export function WorkExperienceView() {
  return (
    <ProfilePageLayout
      activeTab="trajectory"
      title="Trayectoria"
      description="Muestra tus estudios, experiencia, habilidades y certificaciones"
    >
      <TrajectorySteps activeStep="experience" />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <WorkExperienceListCard experiences={SAMPLE_WORK_EXPERIENCES} />
        {/* El formulario "Agregar experiencia" se agrega en la tarea #79 */}
      </div>
    </ProfilePageLayout>
  );
}
