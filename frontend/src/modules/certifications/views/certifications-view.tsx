"use client";

import { ProfilePageLayout } from "@/modules/profile";
import { CertificationProfileSection } from "../components/certification-profile-section";

export function CertificationsView() {
  return <ProfilePageLayout title="Certificaciones" description="Tus certificaciones y documentos de respaldo."><CertificationProfileSection /></ProfilePageLayout>;
}
