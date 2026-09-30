"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useProfileMutations } from "../hooks/use-profile-mutations";
import type {
  CityOption,
  FieldErrors,
  FormFeedback,
  PersonalInfoValues,
  UserProfile,
} from "../types/profile.types";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/api-error";
import { toPersonalInfoValues, trimValues } from "../utils/profile-format";
import { hasErrors, validatePersonalInfo } from "../utils/profile-validation";
import {
  FORM_ACTIONS_CLASS,
  getInputClass,
  MOBILE_PRIMARY_ACTION_CLASS,
  MOBILE_SECONDARY_ACTION_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "../utils/ui-classes";
import { FormFeedbackMessage } from "./form-feedback-message";
import { FormField, getErrorId } from "./form-field";
import { ProfilePhotoUploader } from "./profile-photo-uploader";
import { SectionCard } from "./section-card";

interface PersonalInfoFormProps {
  profile: UserProfile;
  cities: CityOption[];
  onProfileChange: (profile: UserProfile) => void;
}

type PersonalInfoField = keyof PersonalInfoValues;

export function PersonalInfoForm({ profile, cities, onProfileChange }: PersonalInfoFormProps) {
  const { pendingMutation, savePersonalInfo } = useProfileMutations();
  const [values, setValues] = useState<PersonalInfoValues>(() => toPersonalInfoValues(profile));
  const [errors, setErrors] = useState<FieldErrors<PersonalInfoValues>>({});
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);

  const isSaving = pendingMutation === "personal-info";

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const field = event.target.name as PersonalInfoField;
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleCancel = () => {
    setValues(toPersonalInfoValues(profile));
    setErrors({});
    setFeedback(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedValues = trimValues(values);
    const validationErrors = validatePersonalInfo(trimmedValues);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      setFeedback({
        type: "error",
        message: "No se pudo guardar. Revisa los campos marcados.",
      });
      return;
    }

    try {
      const updatedProfile = await savePersonalInfo(trimmedValues);
      onProfileChange(updatedProfile);
      setValues(toPersonalInfoValues(updatedProfile));
      setFeedback({
        type: "success",
        message: "Tus datos personales se guardaron correctamente.",
      });
    } catch (error) {
      setErrors(getApiFieldErrors(error));
      setFeedback({
        type: "error",
        message: getApiErrorMessage(error, "No se pudo guardar tu información. Intenta nuevamente."),
      });
    }
  };

  const fieldProps = (field: PersonalInfoField) => ({
    id: field,
    name: field,
    value: values[field],
    onChange: handleChange,
    disabled: isSaving,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? getErrorId(field) : undefined,
    className: getInputClass(Boolean(errors[field])),
  });

  return (
    <>
      <SectionCard
        title="Tu información personal"
        description="Completa los campos para crear tu perfil. Podrás editarlos más adelante."
      >
        <ProfilePhotoUploader profile={profile} onProfileChange={onProfileChange} />

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="firstName" label="Nombres" required error={errors.firstName}>
              <input
                {...fieldProps("firstName")}
                type="text"
                autoComplete="given-name"
                placeholder="Escribe tus nombres"
              />
            </FormField>
            <FormField id="lastName" label="Apellidos" required error={errors.lastName}>
              <input
                {...fieldProps("lastName")}
                type="text"
                autoComplete="family-name"
                placeholder="Escribe tus apellidos"
              />
            </FormField>
            <FormField id="cityId" label="Ciudad de residencia" required error={errors.cityId}>
              <select {...fieldProps("cityId")}>
                <option value="">Selecciona tu ciudad</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.title}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="phone" label="Teléfono" required error={errors.phone}>
              <input
                {...fieldProps("phone")}
                type="tel"
                autoComplete="tel"
                placeholder="Ej. +591 700 00000"
              />
            </FormField>
            <FormField id="personalEmail" label="Correo personal" required error={errors.personalEmail}>
              <input
                {...fieldProps("personalEmail")}
                type="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
              />
            </FormField>
          </div>

          <FormFeedbackMessage feedback={feedback} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-text-secondary">* Campos obligatorios</p>
            <div className={FORM_ACTIONS_CLASS}>
              <button
                type="button"
                className={`${SECONDARY_BUTTON_CLASS} ${MOBILE_SECONDARY_ACTION_CLASS}`}
                disabled={isSaving}
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`${PRIMARY_BUTTON_CLASS} ${MOBILE_PRIMARY_ACTION_CLASS}`}
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : "Guardar perfil"}
              </button>
            </div>
          </div>
        </form>
      </SectionCard>

      <p className="mt-4 text-[14px] text-text-secondary">
        Al guardar, verás una confirmación de que tus datos quedaron registrados. Podrás editarlos
        cuando quieras.
      </p>
    </>
  );
}
