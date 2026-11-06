"use client";

import { ProfilePageLayout } from "@/modules/profile";
import { EducationProfileSection } from "../components/education-profile-section";

export function EducationView() {
  return <ProfilePageLayout title="Formación académica" description="Tu trayectoria profesional."><EducationProfileSection /></ProfilePageLayout>;
}
