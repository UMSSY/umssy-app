"use client";

import { useLayoutEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  CONTRACT_TYPES,
  EDITING_KEYS,
  FIELD_FOCUS_CLASS,
  INTERNSHIP_CONTRACT_TYPE,
  MAX_LANGUAGES_CHARS,
  MAX_TITLE_CHARS,
  MAX_VACANCIES,
  MAX_VACANCY_DIGITS,
  MODALITIES,
  SALARY_TO_BE_AGREED,
  TITLE_ALLOWED_REGEX,
  TITLE_DISALLOWED_CHARS_REGEX,
  VACANCY_MESSAGES,
} from "../constants/job-offers.constants";
import { countDigits, findCaretAfterDigits, formatSalaryInput } from "../utils/format-salary-input";
import type { Modality } from "../types/modality.types";
import { getMapsLinkError } from "../utils/validate-vacancy";
import { FieldError } from "./field-error";
import { StepActions } from "./step-actions";
import type { InformationStepProps } from "../types/information-step-props.types";

export function InformationStep({
  conditions,
  errors,
  updateField,
  selectModality,
  validateField,
  onCancel,
  onContinue,
}: InformationStepProps) {
  const salaryInputRef = useRef<HTMLInputElement>(null);
  const pendingSalaryDigits = useRef<number | null>(null);
  const isInternship = conditions.contractType === INTERNSHIP_CONTRACT_TYPE;

  useLayoutEffect(() => {
    const input = salaryInputRef.current;
    if (!input || pendingSalaryDigits.current === null) return;
    const caret = findCaretAfterDigits(conditions.salary, pendingSalaryDigits.current);
    pendingSalaryDigits.current = null;
    input.setSelectionRange(caret, caret);
  }, [conditions.salary]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(TITLE_DISALLOWED_CHARS_REGEX, "").slice(0, MAX_TITLE_CHARS);
    updateField("title", sanitized);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (EDITING_KEYS.includes(e.key) || e.ctrlKey || e.metaKey) return;

    if (!TITLE_ALLOWED_REGEX.test(e.key) || conditions.title.length >= MAX_TITLE_CHARS) {
      e.preventDefault();
    }
  };

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (EDITING_KEYS.includes(e.key) || e.ctrlKey || e.metaKey) return;

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleVacancyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField("vacancyCount", e.target.value.replace(/\D/g, "").slice(0, MAX_VACANCY_DIGITS));
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, selectionStart } = e.target;
    const isCaretAtEnd = selectionStart === null || selectionStart === value.length;
    pendingSalaryDigits.current = isCaretAtEnd ? null : countDigits(value.slice(0, selectionStart));
    updateField("salary", formatSalaryInput(value, conditions.salary));
  };

  const handleContractTypeChange = (value: string | null) => {
    updateField("contractType", value ?? "");
    if (value === INTERNSHIP_CONTRACT_TYPE) updateField("salary", "");
  };

  const handleSalaryBlur = () => validateField("salary");

  const vacancyCountMessage =
    errors.vacancyCount ??
    (Number(conditions.vacancyCount) > MAX_VACANCIES ? VACANCY_MESSAGES.maxVacancies : undefined);
  // El enlace se valida mientras se escribe para avisar en tiempo real (HU4-13).
  const mapsLinkMessage =
    errors.mapsLink ?? (conditions.mapsLink.trim() ? getMapsLinkError(conditions.mapsLink) : undefined);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-bold text-ink">
          Información y condiciones de la oferta
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <div className="flex justify-between">
            <Label htmlFor="title" className="text-xs font-semibold">
              Título del puesto <span className="text-ink-soft">*</span>
            </Label>
            <span className="text-xs text-text-secondary">{conditions.title.length}/{MAX_TITLE_CHARS}</span>
          </div>
          <Input 
            id="title" 
            placeholder="Desarrollador Backend" 
            className={cn("mt-1.5", FIELD_FOCUS_CLASS)}
            value={conditions.title} 
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            maxLength={MAX_TITLE_CHARS}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          <FieldError fieldId="title" message={errors.title} />
        </div>

        <div>
          <Label className="text-xs font-semibold">
            Modalidad  <span className="text-ink-soft">*</span>
          </Label>
          <ToggleGroup
            id="modality"
            aria-label="Modalidad"
            value={conditions.modality ? [conditions.modality] : []}
            onValueChange={(values) => {
              const [next] = values;
              if (next) selectModality(next as Modality);
            }}
            className="mt-1.5 grid w-full grid-cols-3 gap-2"
          >
            {MODALITIES.map((modality) => (
              <ToggleGroupItem
                key={modality}
                value={modality}
                variant="outline"
                className="h-auto w-full rounded-md px-3 py-2 text-sm font-semibold text-ink data-[pressed]:border-accent data-[pressed]:bg-accent data-[pressed]:text-surface"
              >
                {modality}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldError fieldId="modality" message={errors.modality} />
        </div>

        <div>
          <Label htmlFor="mapsLink" className="text-xs font-semibold">
            Enlace de Google Maps <span className="text-ink-soft">*</span>
          </Label>
          <Input
            id="mapsLink"
            placeholder="https://maps.app.goo.gl/..."
            className={cn("mt-1.5", FIELD_FOCUS_CLASS)}
            value={conditions.mapsLink} 
            onChange={(event) => updateField("mapsLink" , event.target.value)}
            aria-invalid={Boolean(mapsLinkMessage)}
            aria-describedby={mapsLinkMessage ? "mapsLink-error" : undefined}
          />
          <FieldError fieldId="mapsLink" message={mapsLinkMessage} />
        </div>

        <h3 className="mt-3 border-t border-border pt-6 text-sm font-semibold text-ink md:col-span-2">Condiciones del puesto</h3>
        <div>
          <Label htmlFor="contractType" className="text-xs font-semibold">
            Tipo de contrato <span className="text-ink-soft">*</span>
          </Label>
          <Select value={conditions.contractType} onValueChange={handleContractTypeChange}>
            <SelectTrigger id="contractType" className={cn("mt-1.5 w-full", FIELD_FOCUS_CLASS)}>
              <SelectValue  placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              {CONTRACT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError fieldId="contractType" message={errors.contractType} />
        </div>

        <div>
          <Label htmlFor="category" className="text-xs font-semibold">
            Categoría <span className="text-ink-soft">*</span>
          </Label>
          <Input 
            id="category" 
            placeholder="Tecnología" 
            className={cn("mt-1.5", FIELD_FOCUS_CLASS)}
            value={conditions.category} 
            onChange={(event) => updateField("category", event.target.value)} 
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? "category-error" : undefined}
          />
          <FieldError fieldId="category" message={errors.category} />
        </div>

        <div>
          <Label htmlFor="vacancyCount" className="text-xs font-semibold">
            Número de vacantes <span className="text-ink-soft">*</span>
          </Label>
          <Input 
            id="vacancyCount" 
            placeholder="1" 
            className={cn("mt-1.5", FIELD_FOCUS_CLASS)}
            value={conditions.vacancyCount} 
            onChange={handleVacancyChange}
            onKeyDown={handleNumberKeyDown}
            inputMode="numeric"
            maxLength={MAX_VACANCY_DIGITS}
            aria-invalid={Boolean(vacancyCountMessage)}
            aria-describedby={vacancyCountMessage ? "vacancyCount-error" : undefined}
          />
          <FieldError fieldId="vacancyCount" message={vacancyCountMessage} />
        </div>

        <div>
          <Label htmlFor="salary" className="text-xs font-semibold">
            Salario {!isInternship && <span className="text-ink-soft">*</span>}
          </Label>
          <Input 
            id="salary" 
            ref={salaryInputRef}
            placeholder={isInternship ? SALARY_TO_BE_AGREED : "Bs 6.500 - 8.000"} 
            className={cn("mt-1.5", FIELD_FOCUS_CLASS)}
            value={conditions.salary} 
            disabled={isInternship}
            onChange={handleSalaryChange}
            onBlur={handleSalaryBlur}
            aria-invalid={Boolean(errors.salary)}
            aria-describedby={errors.salary ? "salary-error" : undefined}
          />
          <FieldError fieldId="salary" message={errors.salary} />
        </div>

        <div>
          <Label htmlFor="languages" className="text-xs font-semibold">
            Idiomas <span className="text-ink-soft">*</span>
          </Label>
          <Input 
            id="languages" 
            placeholder="Español, inglés intermedio" 
            className={cn("mt-1.5", FIELD_FOCUS_CLASS)}
            value={conditions.languages} 
            onChange={(event) => updateField("languages", event.target.value)} 
            maxLength={MAX_LANGUAGES_CHARS}
            aria-invalid={Boolean(errors.languages)}
            aria-describedby={errors.languages ? "languages-error" : undefined}
          />
          <FieldError fieldId="languages" message={errors.languages} />
        </div>
      </div>

      <StepActions
        secondaryLabel="Cancelar"
        primaryLabel="Continuar"
        onSecondary={onCancel}
        onPrimary={onContinue}
      />
    </div>
  );
}