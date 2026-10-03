"use client";

import { useState } from "react";
import { PresentationForm } from "../components/presentation-form";
import { ProfilePageLayout } from "../components/profile-page-layout";
import { EMPTY_PRESENTATION_VALUES } from "../config/profile-form-defaults.config";
import type { PresentationValues } from "../types/presentation-values.types";

export function PresentationView() {
  // Values are kept in memory until the profile endpoints are connected (issue #63).
  const [savedValues, setSavedValues] = useState<PresentationValues>(EMPTY_PRESENTATION_VALUES);

  return (
    <ProfilePageLayout
      activeTab="presentation"
      title="Presentación profesional"
      description="Escribe cómo quieres presentarte ante egresados, mentores y empresas."
    >
      <PresentationForm initialValues={savedValues} fullName="" onSubmit={setSavedValues} />
    </ProfilePageLayout>
  );
}
