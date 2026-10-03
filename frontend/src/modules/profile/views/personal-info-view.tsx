"use client";

import { useState } from "react";
import { PersonalInfoForm } from "../components/personal-info-form";
import { ProfilePageLayout } from "../components/profile-page-layout";
import { SAMPLE_CITIES } from "../config/city-options.config";
import { EMPTY_PERSONAL_INFO_VALUES } from "../config/profile-form-defaults.config";
import type { PersonalInfoValues } from "../types/personal-info-values.types";

export function PersonalInfoView() {
  // Values are kept in memory until the profile endpoints are connected (issue #63).
  const [savedValues, setSavedValues] = useState<PersonalInfoValues>(EMPTY_PERSONAL_INFO_VALUES);

  return (
    <ProfilePageLayout
      activeTab="personal-info"
      title="Datos personales y contacto"
      description="Registra tu información para que la comunidad pueda identificarte y contactarte."
    >
      <PersonalInfoForm
        initialValues={savedValues}
        cities={SAMPLE_CITIES}
        onSubmit={setSavedValues}
      />
      <p className="mt-4 text-[14px] text-text-secondary">
        Al guardar, verás una confirmación de que tus datos quedaron registrados.
      </p>
    </ProfilePageLayout>
  );
}
