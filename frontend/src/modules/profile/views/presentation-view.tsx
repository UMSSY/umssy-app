"use client";

import { ProfilePageLayout } from "../components/profile-page-layout";
import { PresentationSettings } from "../components/presentation-settings";

export function PresentationView() {
  return <ProfilePageLayout title="Presentación profesional" description="Actualiza la información de tu perfil."><PresentationSettings /></ProfilePageLayout>;
}
