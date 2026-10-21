"use client";

import { useLayoutEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CONTRACT_TYPES,
  EDITING_KEYS,
  FIELD_FOCUS_CLASS,
  GOOGLE_MAPS_LINK_REGEX,
  INTERNSHIP_CONTRACT_TYPE,
  MAX_LANGUAGES_CHARS,
  MAX_TITLE_CHARS,
  MAX_VACANCIES,
  MODALITIES,
  SALARY_TO_BE_AGREED,
  TITLE_ALLOWED_REGEX,
  TITLE_DISALLOWED_CHARS_REGEX,
  VACANCY_MESSAGES,
} from "../constants/vacancies.constants";
import { countDigits, findCaretAfterDigits, formatSalaryInput } from "../utils/format-salary-input";
import type {
  Modality,
  UpdateVacancyField,
  VacancyConditions,
  VacancyErrors,
} from "../types/vacancy-conditions.types";
import { FieldError } from "./field-error";
import { StepActions } from "./step-actions";

interface InformationStepProps {
  conditions: VacancyConditions;
  errors: VacancyErrors;
  updateField: UpdateVacancyField;
  selectModality: (modality: Modality) => void;
  validateField: (field: keyof VacancyConditions) => void;
  onCancel: () => void;
  onContinue: () => void;
}

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
    updateField("vacancyCount", e.target.value.replace(/\D/g, ""));
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
  const mapsLinkMessage =
    errors.mapsLink ??
    (conditions.mapsLink.trim() && !GOOGLE_MAPS_LINK_REGEX.test(conditions.mapsLink.trim())
      ? VACANCY_MESSAGES.invalidMapsLink
      : undefined);

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-[22px] font-bold text-ink">
          Información y condiciones de la oferta
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <div className="flex justify-between">
            <Label htmlFor="title" className="text-[12.5px] font-semibold">
              Título del puesto <span className="text-danger">*</span>
            </Label>
            <span className="text-[11px] text-slate-400">{conditions.title.length}/{MAX_TITLE_CHARS}</span>
          </div>
          <Input 
            id="title" 
            placeholder="Desarrollador Backend" 
            className={`mt-1.5 ${FIELD_FOCUS_CLASS}`} 
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
          <Label className="text-[12.5px] font-semibold">
            Modalidad  <span className="text-danger">*</span>
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
                className="h-auto w-full rounded-md px-3 py-2 text-sm font-semibold text-ink data-[pressed]:border-ink data-[pressed]:bg-ink data-[pressed]:text-white"
              >
                {modality}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldError fieldId="modality" message={errors.modality} />
        </div>

        <div>
          <Label htmlFor="mapsLink" className="text-[12.5px] font-semibold">
            Enlace de Google Maps <span className="text-danger">*</span>
          </Label>
          <Input
            id="mapsLink"
            placeholder="https://maps.app.goo.gl/..."
            className={`mt-1.5 ${FIELD_FOCUS_CLASS}`}
            value={conditions.mapsLink} 
            onChange={(event) => updateField("mapsLink" , event.target.value)}
            aria-invalid={Boolean(mapsLinkMessage)}
            aria-describedby={mapsLinkMessage ? "mapsLink-error" : undefined}
          />
          <FieldError fieldId="mapsLink" message={mapsLinkMessage} />
        </div>

        <div>
          <Label htmlFor="contractType" className="text-[12.5px] font-semibold">
            Tipo de contrato <span className="text-danger">*</span>
          </Label>
          <Select value={conditions.contractType} onValueChange={handleContractTypeChange}>
            <SelectTrigger id="contractType" className={`mt-1.5 w-full ${FIELD_FOCUS_CLASS}`}>
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
          <Label htmlFor="category" className="text-[12.5px] font-semibold">
            Categoría <span className="text-danger">*</span>
          </Label>
          <Input 
            id="category" 
            placeholder="Tecnología" 
            className={`mt-1.5 ${FIELD_FOCUS_CLASS}`} 
            value={conditions.category} 
            onChange={(event) => updateField("category", event.target.value)} 
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? "category-error" : undefined}
          />
          <FieldError fieldId="category" message={errors.category} />
        </div>

        <div>
          <Label htmlFor="vacancyCount" className="text-[12.5px] font-semibold">
            Número de vacantes <span className="text-danger">*</span>
          </Label>
          <Input 
            id="vacancyCount" 
            placeholder="1" 
            className={`mt-1.5 ${FIELD_FOCUS_CLASS}`} 
            value={conditions.vacancyCount} 
            onChange={handleVacancyChange}
            onKeyDown={handleNumberKeyDown}
            inputMode="numeric"
            aria-invalid={Boolean(vacancyCountMessage)}
            aria-describedby={vacancyCountMessage ? "vacancyCount-error" : undefined}
          />
          <FieldError fieldId="vacancyCount" message={vacancyCountMessage} />
        </div>

        <div>
          <Label htmlFor="salary" className="text-[12.5px] font-semibold">
            Salario {!isInternship && <span className="text-danger">*</span>}
          </Label>
          <Input 
            id="salary" 
            ref={salaryInputRef}
            placeholder={isInternship ? SALARY_TO_BE_AGREED : "Bs 6.500 - 8.000"} 
            className={`mt-1.5 ${FIELD_FOCUS_CLASS}`} 
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
          <Label htmlFor="languages" className="text-[12.5px] font-semibold">
            Idiomas <span className="text-danger">*</span>
          </Label>
          <Input 
            id="languages" 
            placeholder="Español, inglés intermedio" 
            className={`mt-1.5 ${FIELD_FOCUS_CLASS}`}
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