"use client";

import { type ReactNode, useMemo } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { CAREERS } from "@/modules/access-request";
import { type AcademicPeriod, getAcademicPeriods } from "@/modules/reports";
import {
  ALL_CAREERS_LABEL,
  SURVEY_DESCRIPTION_MAX_LENGTH,
  SURVEY_TITLE_MAX_LENGTH,
} from "../constants/survey-form.constants";
import type { SurveyDetailsCardProps } from "../types/survey-details-card-props.types";
import { SurveyFieldError } from "./survey-field-error";

const ALL_CAREERS_VALUE = "ALL";
const FIELD_CLASSES = "h-10 rounded-md border-border bg-surface text-sm text-ink";
const INVALID_CLASSES = "border-destructive";

export function SurveyDetailsCard({ values, errors, onChange }: SurveyDetailsCardProps) {
  const periods = useMemo(() => getAcademicPeriods(), []);

  const selectField = (id: string, label: string, error: string | undefined, children: ReactNode) => (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-ink-soft">
        {label} <span className="text-destructive">*</span>
      </Label>
      {children}
      <SurveyFieldError id={`${id}-error`} message={error} />
    </div>
  );

  return (
    <section
      aria-label="Datos de la encuesta"
      className="flex flex-col gap-4 rounded-lg border border-t-4 border-border border-t-ink bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="survey-title" className="sr-only">
          Título de la encuesta
        </Label>
        <Input
          id="survey-title"
          value={values.title}
          maxLength={SURVEY_TITLE_MAX_LENGTH}
          placeholder="Título de la encuesta"
          aria-invalid={Boolean(errors.title)}
          aria-describedby="survey-title-error"
          onChange={(event) => onChange("title", event.target.value)}
          className={cn("h-auto rounded-none border-0 border-b border-border px-0 py-2 font-tight text-xl font-semibold text-ink shadow-none focus-visible:border-ink focus-visible:ring-0 md:text-2xl", errors.title && INVALID_CLASSES)}
        />
        <SurveyFieldError id="survey-title-error" message={errors.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="survey-description" className="sr-only">
          Descripción
        </Label>
        <Textarea
          id="survey-description"
          value={values.description}
          maxLength={SURVEY_DESCRIPTION_MAX_LENGTH}
          placeholder="Descripción de la encuesta"
          onChange={(event) => onChange("description", event.target.value)}
          className="min-h-16 resize-y rounded-md border-border bg-surface text-sm text-text-secondary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {selectField(
          "survey-career",
          "Carrera dirigida",
          undefined,
          <NativeSelect
            id="survey-career"
            value={values.targetCareer ?? ALL_CAREERS_VALUE}
            onChange={(event) => onChange("targetCareer", event.target.value === ALL_CAREERS_VALUE ? null : event.target.value)}
            className="w-full [&_select]:h-10"
          >
            {CAREERS.map((career) => (
              <NativeSelectOption key={career} value={career}>
                {career}
              </NativeSelectOption>
            ))}
            <NativeSelectOption value={ALL_CAREERS_VALUE}>{ALL_CAREERS_LABEL}</NativeSelectOption>
          </NativeSelect>,
        )}

        {selectField(
          "survey-period",
          "Gestión",
          errors.period,
          <NativeSelect
            id="survey-period"
            value={values.period ?? ""}
            aria-invalid={Boolean(errors.period)}
            aria-describedby="survey-period-error"
            onChange={(event) => onChange("period", (event.target.value || null) as AcademicPeriod | null)}
            className="w-full [&_select]:h-10"
          >
            <NativeSelectOption value="">Selecciona una gestión</NativeSelectOption>
            {periods.map((period) => (
              <NativeSelectOption key={period} value={period}>
                {period}
              </NativeSelectOption>
            ))}
          </NativeSelect>,
        )}

        {selectField(
          "survey-opens-at",
          "Apertura",
          errors.opensAt,
          <Input
            id="survey-opens-at"
            type="date"
            value={values.opensAt}
            aria-invalid={Boolean(errors.opensAt)}
            aria-describedby="survey-opens-at-error"
            onChange={(event) => onChange("opensAt", event.target.value)}
            className={cn(FIELD_CLASSES, errors.opensAt && INVALID_CLASSES)}
          />,
        )}

        {selectField(
          "survey-closes-at",
          "Cierre",
          errors.closesAt,
          <Input
            id="survey-closes-at"
            type="date"
            value={values.closesAt}
            min={values.opensAt || undefined}
            aria-invalid={Boolean(errors.closesAt)}
            aria-describedby="survey-closes-at-error"
            onChange={(event) => onChange("closesAt", event.target.value)}
            className={cn(FIELD_CLASSES, errors.closesAt && INVALID_CLASSES)}
          />,
        )}
      </div>
    </section>
  );
}
