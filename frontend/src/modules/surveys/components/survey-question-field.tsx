"use client";

import { cn } from "cn";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SurveyQuestionFieldProps } from "../types/survey-component-props.types";
import { RequiredMark } from "./required-mark";

export function SurveyQuestionField({
  question,
  index,
  idPrefix,
  selectedOptionIds,
  onChange,
  isReadOnly = false,
  hint,
  error,
}: SurveyQuestionFieldProps) {
  const baseId = `${idPrefix}-${question.id}`;
  const isControlled = selectedOptionIds !== undefined;
  const selected = selectedOptionIds ?? [];
  const options = question.options ?? [];

  const optionClasses = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg border p-3.5 transition-colors",
      isActive ? "border-primary bg-primary/5 text-ink" : "border-border bg-surface text-ink",
      !isReadOnly && !isActive && "hover:bg-muted",
    );

  const toggleOption = (optionId: string, isChecked: boolean) =>
    onChange?.(isChecked ? [...selected, optionId] : selected.filter((id) => id !== optionId));

  return (
    <fieldset
      id={`${baseId}-card`}
      className={cn(
        "rounded-xl border bg-surface p-6 shadow-xs transition-colors",
        error ? "border-danger ring-1 ring-danger/30" : "border-border",
      )}
    >
      <legend id={`${baseId}-legend`} className="float-left mb-3 w-full text-base font-semibold text-ink">
        <span className="text-primary">{index + 1}.</span> {question.statement}
        {question.isRequired && <RequiredMark className="ml-1" />}
      </legend>

      {hint && <p className="clear-both mb-4 text-xs font-normal text-text-secondary">{hint}</p>}

      {question.type === "single_choice" ? (
        <RadioGroup
          aria-labelledby={`${baseId}-legend`}
          disabled={isReadOnly}
          {...(isControlled && { value: selected[0] ?? "" })}
          onValueChange={(value) => onChange?.([String(value)])}
          className="clear-both flex flex-col gap-2.5"
        >
          {options.map((option) => (
            <div key={option.id} className={optionClasses(selected[0] === option.id)}>
              <RadioGroupItem id={`${baseId}-${option.id}`} value={option.id} />
              <Label htmlFor={`${baseId}-${option.id}`} className="flex-1 cursor-pointer text-sm font-medium">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="clear-both flex flex-col gap-2.5">
          {options.map((option) => {
            const isChecked = selected.includes(option.id);
            return (
              <div key={option.id} className={optionClasses(isChecked)}>
                <Checkbox
                  id={`${baseId}-${option.id}`}
                  disabled={isReadOnly}
                  {...(isControlled && { checked: isChecked })}
                  onCheckedChange={(checked) => toggleOption(option.id, Boolean(checked))}
                />
                <Label htmlFor={`${baseId}-${option.id}`} className="flex-1 cursor-pointer text-sm font-medium">
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-3 text-xs font-medium text-danger">{error}</p>}
    </fieldset>
  );
}
