"use client";

import { ProfilePageLayout } from "../components/profile-page-layout";
import { PersonalInfoSettings } from "../components/personal-info-settings";

export function PersonalInfoView() {
  return <ProfilePageLayout title="Datos personales y contacto" description="Actualiza la información de tu perfil."><PersonalInfoSettings /></ProfilePageLayout>;
}
