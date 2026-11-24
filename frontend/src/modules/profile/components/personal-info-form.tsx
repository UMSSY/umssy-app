"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useProfileCompletionFocus } from "../hooks/use-profile-completion-focus";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PersonalInfoErrors } from "../types/personal-info-errors.types";
import type { PersonalInfoFormProps } from "../types/personal-info-form-props.types";
import type { PersonalInfoValues } from "../types/personal-info-values.types";
import { PHONE_HINT } from "../constants/profile-validation.constants";
import { getFieldErrorId, getFieldErrorProps } from "../utils/get-field-error-props";
import { sanitizeNameInput } from "../utils/sanitize-name-input";
import { sanitizePhoneInput } from "../utils/sanitize-phone-input";
import { trimFormValues } from "../utils/trim-form-values";
import { validatePersonalInfo } from "../utils/validate-personal-info";
import { FormField } from "./form-field";
import { ProfilePhotoField } from "./profile-photo-field";
import { SocialAccountConnectButtons } from "./social-account-connect-buttons";
import { FormSection } from "@/shared/components/layout/form-section";

function sanitizeFieldValue(field: keyof PersonalInfoValues, value: string): string {
  if (field === "phone") return sanitizePhoneInput(value);
  if (field === "firstName" || field === "lastName") return sanitizeNameInput(value);
  return value;
}

export function PersonalInfoForm({
  idPrefix = "",
  saveLabel = "Guardar perfil",
  initialValues,
  cities = [],
  isSaving = false,
  serverErrors = {},
  onEdit,
  photo,
  onSubmit,
}: PersonalInfoFormProps) {
  const [values, setValues] = useState<PersonalInfoValues>(initialValues);
  const [localErrors, setErrors] = useState<PersonalInfoErrors>({});
  const errors = { ...localErrors, ...serverErrors };
  const fieldIds = {
    firstName: `${idPrefix}firstName`,
    lastName: `${idPrefix}lastName`,
    cityId: `${idPrefix}cityId`,
    phone: `${idPrefix}phone`,
    personalEmail: `${idPrefix}personalEmail`,
    phoneHint: `${idPrefix}phone-hint`,
  };
  useProfileCompletionFocus('contact', {
    [fieldIds.firstName]: values.firstName,
    [fieldIds.lastName]: values.lastName,
    [fieldIds.cityId]: values.cityId,
    [fieldIds.phone]: values.phone,
    [fieldIds.personalEmail]: values.personalEmail,
  }, !isSaving && !idPrefix);

  const updateField = (field: keyof PersonalInfoValues, value: string) => {
    onEdit?.(field);
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as keyof PersonalInfoValues;
    updateField(field, sanitizeFieldValue(field, event.target.value));
  };

  const handleCityChange = (cityId: string | null) => {
    updateField("cityId", cityId ?? "");
  };

  const handleCancel = () => {
    onEdit?.();
    setValues(initialValues);
    setErrors({});
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    const trimmedValues = trimFormValues(values);
    const validationErrors = validatePersonalInfo(trimmedValues);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(trimmedValues);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border p-4 sm:p-6 lg:px-8">
      <ProfilePhotoField {...photo} idPrefix={idPrefix} />

      </div>
      <form onSubmit={handleSubmit} noValidate className="px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <FormSection title="Identidad" description="Tu nombre en la comunidad.">
          <div className="grid gap-5 md:grid-cols-2">
          <FormField id={fieldIds.firstName} label="Nombres" isRequired error={errors.firstName}>
            <Input
              id={fieldIds.firstName}
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Escribe tus nombres"
              value={values.firstName}
              disabled={isSaving}
              onChange={handleChange}
              className="h-11"
              {...getFieldErrorProps(fieldIds.firstName, errors.firstName)}
            />
          </FormField>
          <FormField id={fieldIds.lastName} label="Apellidos" isRequired error={errors.lastName}>
            <Input
              id={fieldIds.lastName}
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Escribe tus apellidos"
              value={values.lastName}
              disabled={isSaving}
              onChange={handleChange}
              className="h-11"
              {...getFieldErrorProps(fieldIds.lastName, errors.lastName)}
            />
          </FormField>
          </div>
        </FormSection>
        <FormSection title="Contacto" description="Dónde pueden encontrarte." className="[&>div]:grid-cols-1 sm:[&>div]:grid-cols-3 [&>div>div]:col-span-1 sm:[&>div>div]:col-span-2">
          <div className="grid gap-5 md:grid-cols-2">
          <FormField id={fieldIds.cityId} label="Ciudad de residencia" isRequired error={errors.cityId}>
            <Select
              name="cityId"
              value={values.cityId || null}
              items={cities.map((city) => ({ value: city.id, label: city.title }))}
              disabled={isSaving}
              onValueChange={handleCityChange}
            >
              <SelectTrigger
                id={fieldIds.cityId}
                className="w-full data-[size=default]:h-11"
                {...getFieldErrorProps(fieldIds.cityId, errors.cityId)}
              >
                <SelectValue placeholder="Selecciona tu ciudad" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id} className="text-base">
                    {city.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id={fieldIds.phone} label="Teléfono" isRequired error={errors.phone}>
            <Input
              id={fieldIds.phone}
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Ej. +591 700 00000"
              value={values.phone}
              disabled={isSaving}
              onChange={handleChange}
              className="h-11"
              {...getFieldErrorProps(fieldIds.phone, errors.phone)}
              aria-describedby={[fieldIds.phoneHint, errors.phone ? getFieldErrorId(fieldIds.phone) : null]
                .filter(Boolean)
                .join(" ")}
            />
            <p id={fieldIds.phoneHint} className="text-sm text-text-secondary">
              {PHONE_HINT}
            </p>
          </FormField>
          <div className="grid min-w-0 gap-3 md:col-span-2 @2xl/form-section:grid-cols-2">
            <FormField
              id={fieldIds.personalEmail}
              label="Correo personal"
              isRequired
              error={errors.personalEmail}
            >
              <Input
                id={fieldIds.personalEmail}
                name="personalEmail"
                type="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
                value={values.personalEmail}
                disabled={isSaving}
                onChange={handleChange}
                className="h-11"
                {...getFieldErrorProps(fieldIds.personalEmail, errors.personalEmail)}
              />
            </FormField>
            <SocialAccountConnectButtons className="@2xl/form-section:pt-7" />
          </div>
          </div>
        </FormSection>
        <div className="-mx-4 flex flex-col gap-4 rounded-b-lg border-t border-border bg-surface p-4 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 lg:-mx-8 lg:px-8">
          <p className="text-sm text-text-secondary">* Campos obligatorios</p>
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
    </div>
  );
}
