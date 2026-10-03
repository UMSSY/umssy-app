"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  INPUT_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "../config/form-styles.config";
import type { PersonalInfoErrors } from "../types/personal-info-errors.types";
import type { PersonalInfoFormProps } from "../types/personal-info-form-props.types";
import type { PersonalInfoValues } from "../types/personal-info-values.types";
import { getFieldErrorProps } from "../utils/get-field-error-props";
import { trimFormValues } from "../utils/trim-form-values";
import { validatePersonalInfo } from "../utils/validate-personal-info";
import { FormField } from "./form-field";
import { ProfilePhotoField } from "./profile-photo-field";
import { SectionCard } from "./section-card";

export function PersonalInfoForm({
  initialValues,
  cities,
  isSaving = false,
  onSubmit,
}: PersonalInfoFormProps) {
  const [values, setValues] = useState<PersonalInfoValues>(initialValues);
  const [errors, setErrors] = useState<PersonalInfoErrors>({});

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = event.target.name as keyof PersonalInfoValues;
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleCancel = () => {
    setValues(initialValues);
    setErrors({});
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedValues = trimFormValues(values);
    const validationErrors = validatePersonalInfo(trimmedValues);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(trimmedValues);
    }
  };

  return (
    <SectionCard
      title="Tu información personal"
      description="Completa los campos para crear tu perfil. Podrás editarlos más adelante."
    >
      <ProfilePhotoField />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8 pt-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <FormField id="firstName" label="Nombres" isRequired error={errors.firstName}>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Escribe tus nombres"
              value={values.firstName}
              disabled={isSaving}
              onChange={handleChange}
              className={INPUT_CLASS}
              {...getFieldErrorProps("firstName", errors.firstName)}
            />
          </FormField>
          <FormField id="lastName" label="Apellidos" isRequired error={errors.lastName}>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Escribe tus apellidos"
              value={values.lastName}
              disabled={isSaving}
              onChange={handleChange}
              className={INPUT_CLASS}
              {...getFieldErrorProps("lastName", errors.lastName)}
            />
          </FormField>
          <FormField id="cityId" label="Ciudad de residencia" isRequired error={errors.cityId}>
            <select
              id="cityId"
              name="cityId"
              value={values.cityId}
              disabled={isSaving}
              onChange={handleChange}
              className={INPUT_CLASS}
              {...getFieldErrorProps("cityId", errors.cityId)}
            >
              <option value="">Selecciona tu ciudad</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.title}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="phone" label="Teléfono" isRequired error={errors.phone}>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Ej. +591 700 00000"
              value={values.phone}
              disabled={isSaving}
              onChange={handleChange}
              className={INPUT_CLASS}
              {...getFieldErrorProps("phone", errors.phone)}
            />
          </FormField>
          <FormField
            id="personalEmail"
            label="Correo personal"
            isRequired
            error={errors.personalEmail}
          >
            <input
              id="personalEmail"
              name="personalEmail"
              type="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              value={values.personalEmail}
              disabled={isSaving}
              onChange={handleChange}
              className={INPUT_CLASS}
              {...getFieldErrorProps("personalEmail", errors.personalEmail)}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-between gap-6">
          <p className="text-[13px] text-text-secondary">* Campos obligatorios</p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className={SECONDARY_BUTTON_CLASS}
              disabled={isSaving}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button type="submit" className={cn(PRIMARY_BUTTON_CLASS, "min-w-44")} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar perfil"}
            </Button>
          </div>
        </div>
      </form>
    </SectionCard>
  );
}
