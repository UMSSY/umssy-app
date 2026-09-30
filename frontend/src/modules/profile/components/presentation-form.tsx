"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useProfileMutations } from "../hooks/use-profile-mutations";
import { profileService } from "../services/profile.service";
import type {
  FieldErrors,
  FormFeedback,
  PresentationValues,
  UserProfile,
} from "../types/profile.types";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/api-error";
import { toPresentationValues, trimValues } from "../utils/profile-format";
import {
  ABOUT_ME_MAX_LENGTH,
  HEADLINE_MAX_LENGTH,
  hasErrors,
  INTERESTED_OPPORTUNITIES_MAX_LENGTH,
  validatePresentation,
} from "../utils/profile-validation";
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
import { ProfilePreviewCard } from "./profile-preview-card";
import { SectionCard } from "./section-card";

interface PresentationFormProps {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

type PresentationField = keyof PresentationValues;

const WRITING_TIPS = [
  "Usa un titular breve y concreto.",
  "Menciona tu especialidad.",
  "Explica qué oportunidades buscas.",
];

export function PresentationForm({ profile, onProfileChange }: PresentationFormProps) {
  const { pendingMutation, savePresentation } = useProfileMutations();
  const [values, setValues] = useState<PresentationValues>(() => toPresentationValues(profile));
  const [errors, setErrors] = useState<FieldErrors<PresentationValues>>({});
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);

  const isSaving = pendingMutation === "presentation";

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.target.name as PresentationField;
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleCancel = () => {
    setValues(toPresentationValues(profile));
    setErrors({});
    setFeedback(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedValues = trimValues(values);
    const validationErrors = validatePresentation(trimmedValues);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      setFeedback({
        type: "error",
        message: "No se pudo guardar. Revisa los campos marcados.",
      });
      return;
    }

    try {
      const updatedProfile = await savePresentation(trimmedValues);
      onProfileChange(updatedProfile);
      setValues(toPresentationValues(updatedProfile));
      setFeedback({
        type: "success",
        message: "Tu presentación profesional se guardó correctamente.",
      });
    } catch (error) {
      setErrors(getApiFieldErrors(error));
      setFeedback({
        type: "error",
        message: getApiErrorMessage(error, "No se pudo guardar tu presentación. Intenta nuevamente."),
      });
    }
  };

  const fieldProps = (field: PresentationField) => ({
    id: field,
    name: field,
    value: values[field],
    onChange: handleChange,
    disabled: isSaving,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? getErrorId(field) : undefined,
    className: getInputClass(Boolean(errors[field])),
  });

  const counter = (field: PresentationField, max: number) =>
    `${values[field].length}/${max} caracteres`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <SectionCard
        title="Escribe tu presentación"
        description="Un resumen claro ayuda a entender qué haces y qué buscas."
      >
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormField
            id="headline"
            label="Titular profesional"
            required
            error={errors.headline}
            hint={counter("headline", HEADLINE_MAX_LENGTH)}
          >
            <input
              {...fieldProps("headline")}
              type="text"
              maxLength={HEADLINE_MAX_LENGTH}
              placeholder="Ej. Desarrolladora web junior"
            />
          </FormField>
          <FormField
            id="aboutMe"
            label="Acerca de"
            required
            error={errors.aboutMe}
            hint={counter("aboutMe", ABOUT_ME_MAX_LENGTH)}
          >
            <textarea
              {...fieldProps("aboutMe")}
              rows={6}
              maxLength={ABOUT_ME_MAX_LENGTH}
              placeholder="Cuenta quién eres, en qué te especializas y qué te motiva."
            />
          </FormField>
          <FormField
            id="interestedOpportunities"
            label="Oportunidades que me interesan"
            error={errors.interestedOpportunities}
            hint={counter("interestedOpportunities", INTERESTED_OPPORTUNITIES_MAX_LENGTH)}
          >
            <textarea
              {...fieldProps("interestedOpportunities")}
              rows={3}
              maxLength={INTERESTED_OPPORTUNITIES_MAX_LENGTH}
              placeholder="Ej. Prácticas o empleo en desarrollo frontend, trabajo remoto."
            />
          </FormField>

          <FormFeedbackMessage feedback={feedback} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-text-secondary">
              Estos textos aparecerán en tu perfil público.
            </p>
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
                {isSaving ? "Guardando..." : "Guardar presentación"}
              </button>
            </div>
          </div>
        </form>
      </SectionCard>

      <div className="flex flex-col gap-6">
        <ProfilePreviewCard
          firstName={profile.firstName}
          lastName={profile.lastName}
          photoUrl={profileService.buildPhotoUrl(profile.photoPath)}
          headline={values.headline}
          aboutMe={values.aboutMe}
          interestedOpportunities={values.interestedOpportunities}
        />
        <SectionCard title="Para escribirla mejor" className="hidden lg:block">
          <ul className="flex list-disc flex-col gap-1 pl-4 text-[13px] text-text-secondary">
            {WRITING_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
