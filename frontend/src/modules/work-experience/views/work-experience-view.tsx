"use client";

import { ProfilePageLayout } from "@/modules/profile";
import { WorkExperienceProfileSection } from "../components/work-experience-profile-section";

export function WorkExperienceView() {
  return <ProfilePageLayout title="Experiencia laboral" description="Tu trayectoria profesional."><WorkExperienceProfileSection /></ProfilePageLayout>;
}
