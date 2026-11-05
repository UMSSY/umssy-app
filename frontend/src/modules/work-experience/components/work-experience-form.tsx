"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getFieldErrorProps } from "@/modules/profile";
import { FeedbackMessage, FormField, DetectedSkillsChips } from "@/modules/profile";
import { DateField } from "@/shared/components/date-field";
import { FormFieldset } from "@/shared/components/layout/form-fieldset";
import { skillsAnalysisService, type DetectedSkill } from "@/modules/matching";
import { EMPTY_WORK_EXPERIENCE_FORM_VALUES } from "../config/work-experience-form-defaults.config";
import {
  WORK_EXPERIENCE_COMPANY_NAME_MAX_LENGTH,
  WORK_EXPERIENCE_DESCRIPTION_MAX_LENGTH,
  WORK_EXPERIENCE_MIN_DATE,
  WORK_EXPERIENCE_POSITION_MAX_LENGTH,
} from "../constants/work-experience-validation.constants";
import type { WorkExperienceErrors } from "../types/work-experience-errors.types";
import type { WorkExperienceFormProps } from "../types/work-experience-form-props.types";
import type { WorkExperienceFormValues } from "../types/work-experience-form-values.types";
import { getTodayIsoDate } from "../utils/get-today-iso-date";
import { normalizeWorkExperienceDescription } from "../utils/normalize-work-experience-description";
import { validateWorkExperience } from "../utils/validate-work-experience";

const ANALYSIS_DEBOUNCE_MS = 500;

export function WorkExperienceForm({
  initialValues,
  experienceId,
  initialDetectedSkills = [],
  isPending = false,
  feedback = null,
  onSubmit,
  onCancel,
  onValuesChange,
}: WorkExperienceFormProps) {
  const [values, setValues] = useState<WorkExperienceFormValues>(
    initialValues ?? EMPTY_WORK_EXPERIENCE_FORM_VALUES,
  );

  const [errors, setErrors] = useState<WorkExperienceErrors>({});

  const [detectedSkills, setDetectedSkills] = useState<DetectedSkill[]>(
    normalizeWorkExperienceDescription(
      initialValues?.description ?? EMPTY_WORK_EXPERIENCE_FORM_VALUES.description,
    )
      ? initialDetectedSkills
      : [],
  );

  const [processingTimeMs, setProcessingTimeMs] = useState<number | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isEditing = Boolean(initialValues);
  const title = isEditing ? "Editar experiencia" : "Agregar experiencia";
  const today = getTodayIsoDate();
  const analysisRequestId = useRef(0);

  useEffect(() => {
    if (!experienceId) {
      return;
    }

    const normalizedDescription = normalizeWorkExperienceDescription(
      values.description,
    );

    if (!normalizedDescription) {
      return;
    }

    const requestId = ++analysisRequestId.current;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      setIsAnalyzing(true);

      void skillsAnalysisService
        .previewExperience(experienceId, normalizedDescription)
        .then((result) => {
          if (cancelled || requestId !== analysisRequestId.current) {
            return;
          }

          setDetectedSkills(result.skills);
          setProcessingTimeMs(result.processingTimeMs);
        })
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled && requestId === analysisRequestId.current) {
            setIsAnalyzing(false);
          }
        });
    }, ANALYSIS_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [experienceId, values.description]);

  const handleValueChange = (
    name: keyof WorkExperienceFormValues,
    value: string,
  ) => {
    onValuesChange?.();

    if (name === "description") {
      setIsAnalyzing(false);

      if (!normalizeWorkExperienceDescription(value)) {
        analysisRequestId.current += 1;
        setDetectedSkills([]);
        setProcessingTimeMs(undefined);
      }
    }

    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    handleValueChange(
      event.target.name as keyof WorkExperienceFormValues,
      event.target.value,
    );
  };

  const handleCurrentChange = (checked: boolean) => {
    onValuesChange?.();

    setValues((current) => ({
      ...current,
      isCurrent: checked,
      endDate: checked ? "" : current.endDate,
    }));

    setErrors((current) => ({ ...current, endDate: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateWorkExperience(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    await onSubmit(values);
  };

  return (
    <div className="min-w-0">
      <form
        aria-label={title}
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        <FormFieldset title="Puesto y empresa">
          <FormField
            id="work-experience-companyName"
            error={errors.companyName}
            label="Empresa"
            isRequired
          >
            <Input
              id="work-experience-companyName"
              {...getFieldErrorProps(
                "work-experience-companyName",
                errors.companyName,
              )}
              name="companyName"
              type="text"
              placeholder="Nombre de la empresa"
              maxLength={WORK_EXPERIENCE_COMPANY_NAME_MAX_LENGTH}
              value={values.companyName}
              disabled={isPending}
              onChange={handleChange}
              className="h-11"
            />
          </FormField>

          <FormField
            id="work-experience-position"
            error={errors.position}
            label="Cargo"
            isRequired
          >
            <Input
              id="work-experience-position"
              {...getFieldErrorProps(
                "work-experience-position",
                errors.position,
              )}
              name="position"
              type="text"
              placeholder="Ej. Desarrollador frontend"
              maxLength={WORK_EXPERIENCE_POSITION_MAX_LENGTH}
              value={values.position}
              disabled={isPending}
              onChange={handleChange}
              className="h-11"
            />

            <p className="mt-1 text-right text-xs text-text-secondary">
              {values.position.length}/{WORK_EXPERIENCE_POSITION_MAX_LENGTH}
            </p>
          </FormField>
        </FormFieldset>

        <FormFieldset title="Periodo y funciones">
          <div className="grid grid-cols-2 gap-5">
            <FormField
              id="work-experience-startDate"
              error={errors.startDate}
              label="Desde"
              isRequired
            >
              <DateField
                id="work-experience-startDate"
                {...getFieldErrorProps(
                  "work-experience-startDate",
                  errors.startDate,
                )}
                name="startDate"
                min={WORK_EXPERIENCE_MIN_DATE}
                max={today}
                value={values.startDate}
                disabled={isPending}
                onValueChange={(value) =>
                  handleValueChange("startDate", value)
                }
                className="h-11"
              />
            </FormField>

            <FormField
              id="work-experience-endDate"
              error={errors.endDate}
              label="Hasta"
            >
              <DateField
                id="work-experience-endDate"
                {...getFieldErrorProps(
                  "work-experience-endDate",
                  errors.endDate,
                )}
                name="endDate"
                min={WORK_EXPERIENCE_MIN_DATE}
                max={today}
                value={values.endDate}
                disabled={isPending || values.isCurrent}
                onValueChange={(value) =>
                  handleValueChange("endDate", value)
                }
                className="h-11"
              />
            </FormField>
          </div>

          <Label
            htmlFor="work-experience-isCurrent"
            className="flex items-center gap-3 text-sm text-ink"
          >
            <Checkbox
              id="work-experience-isCurrent"
              name="isCurrent"
              checked={values.isCurrent}
              disabled={isPending}
              onCheckedChange={handleCurrentChange}
              className="size-4 border-border-strong data-checked:border-accent data-checked:bg-accent data-checked:text-white"
            />
            Trabajo actualmente aquí
          </Label>

          <FormField
            id="work-experience-description"
            error={errors.description}
            label="Descripción de funciones"
            isRequired
          >
            <Textarea
              id="work-experience-description"
              {...getFieldErrorProps(
                "work-experience-description",
                errors.description,
              )}
              name="description"
              maxLength={WORK_EXPERIENCE_DESCRIPTION_MAX_LENGTH}
              rows={4}
              placeholder="Describe las funciones que desempeñaste en este cargo"
              value={values.description}
              disabled={isPending}
              onChange={handleChange}
              className="field-sizing-fixed min-h-36 resize-y text-sm"
            />

            <p className="mt-1 text-right text-xs text-text-secondary">
              {values.description.length}/
              {WORK_EXPERIENCE_DESCRIPTION_MAX_LENGTH}
            </p>

            {experienceId ? (
              <DetectedSkillsChips
                skills={detectedSkills}
                processingTimeMs={processingTimeMs}
                isLoading={isAnalyzing}
              />
            ) : null}
          </FormField>
        </FormFieldset>

        <FeedbackMessage feedback={feedback} />

        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="outline"
            className="h-10 border-border-strong px-4 text-sm text-ink hover:bg-surface-soft"
            disabled={isPending}
            onClick={onCancel}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            className={cn(
              "h-10 min-w-44 bg-primary px-4 text-sm text-primary-foreground hover:bg-brand-hover",
            )}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            {isPending ? "Guardando..." : "Guardar experiencia"}
          </Button>
        </div>
      </form>
    </div>
  );
}