"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useProfileCompletionFocus } from "../hooks/use-profile-completion-focus";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PresentationErrors } from "../types/presentation-errors.types";
import type { PresentationFormProps } from "../types/presentation-form-props.types";
import type { PresentationValues } from "../types/presentation-values.types";
import { getFieldErrorProps } from "../utils/get-field-error-props";
import { trimFormValues } from "../utils/trim-form-values";
import { validatePresentation } from "../utils/validate-presentation";
import { FormField } from "./form-field";
import { PresentationLeaveDialog } from "./presentation-leave-dialog";
import { SectionCard } from "./section-card";
import { FormFieldset } from "@/shared/components/layout/form-fieldset";

export function PresentationForm({
  idPrefix = "",
  saveLabel = "Guardar presentación",
  initialValues,
  isSaving = false,
  guardProfileReview = false,
  serverErrors = {},
  onEdit,
  onSubmit,
}: PresentationFormProps) {
  const [draft, setDraft] = useState<PresentationValues | null>(null);
  const values = draft ?? initialValues;
  const lastEditedField = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [localErrors, setErrors] = useState<PresentationErrors>({});
  const errors = { ...localErrors, ...serverErrors };
  const fieldIds = {
    headline: `${idPrefix}headline`,
    aboutMe: `${idPrefix}aboutMe`,
  };
  useProfileCompletionFocus('presentation', {
    [fieldIds.headline]: values.headline,
    [fieldIds.aboutMe]: values.aboutMe,
  }, !isSaving && !idPrefix);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.target.name as keyof PresentationValues;
    onEdit?.(field);
    lastEditedField.current = event.target;
    const next = { ...values, [field]: event.target.value };
    const isUnchanged = next.headline === initialValues.headline && next.aboutMe === initialValues.aboutMe;
    setDraft(isUnchanged ? null : next);
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleCancel = () => {
    onEdit?.();
    setDraft(null);
    setErrors({});
  };

  const saveValues = async () => {
    if (isSaving) return false;
    const trimmedValues = trimFormValues(values);
    const validationErrors = validatePresentation(trimmedValues);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return false;
    const saved = await onSubmit(trimmedValues);
    if (saved) setDraft(null);
    return saved === true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveValues();
  };

  return (
    <div>
      <SectionCard
        title="Escribe tu presentación"
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormFieldset title="Tu especialidad">
          <FormField id={fieldIds.headline} label="Titular profesional" isRequired error={errors.headline}>
            <Input
              id={fieldIds.headline}
              name="headline"
              type="text"
              placeholder="Ej. Desarrolladora web junior"
              value={values.headline}
              disabled={isSaving}
              onChange={handleChange}
              className="h-11"
              {...getFieldErrorProps(fieldIds.headline, errors.headline)}
            />
          </FormField>
          </FormFieldset>
          <FormFieldset title="Sobre ti">
          <FormField id={fieldIds.aboutMe} label="Acerca de" isRequired error={errors.aboutMe}>
            <Textarea
              id={fieldIds.aboutMe}
              name="aboutMe"
              rows={6}
              placeholder="Cuenta quién eres, en qué te especializas y qué oportunidades laborales te interesan."
              value={values.aboutMe}
              disabled={isSaving}
              onChange={handleChange}
              className="field-sizing-fixed min-h-36 resize-y text-sm"
              {...getFieldErrorProps(fieldIds.aboutMe, errors.aboutMe)}
            />
          </FormField>

          </FormFieldset>
          <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Los cambios se muestran al guardar.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full border-border-strong px-4 text-sm text-ink hover:bg-surface-soft sm:w-auto"
                disabled={isSaving}
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button type="submit" className={cn("h-10 w-full bg-primary px-4 text-sm text-primary-foreground hover:bg-brand-hover sm:w-auto sm:min-w-44")} disabled={isSaving}>
                {isSaving ? "Guardando..." : saveLabel}
              </Button>
            </div>
          </div>
        </form>
      </SectionCard>
      {guardProfileReview && (
        <PresentationLeaveDialog
          dirty={values.headline !== initialValues.headline || values.aboutMe !== initialValues.aboutMe}
          isSaving={isSaving}
          returnFocus={lastEditedField}
          onSave={saveValues}
          onDiscard={handleCancel}
        />
      )}

    </div>
  );
}
