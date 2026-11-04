"use client";

import { cn } from "cn";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SURVEY_ANSWER_TEXT } from "../constants/survey-answer.constants";
import type { SurveyQuestionFieldProps } from "../types/survey-component-props.types";
import { RequiredMark } from "./required-mark";

type SurveyQuestionFieldVariant = "card" | "plain";

export function SurveyQuestionField({
  question,
  index,
  idPrefix,
  selectedOptionIds,
  onChange,
  isReadOnly = false,
  hint,
  error,
  variant = "card",
}: SurveyQuestionFieldProps & { variant?: SurveyQuestionFieldVariant }) {
  const baseId = `${idPrefix}-${question.id}`;
  const isControlled = selectedOptionIds !== undefined;
  const selected = selectedOptionIds ?? [];
  const options = question.options ?? [];
  const isPlain = variant === "plain";
  const isInvalid = Boolean(error) || undefined;

  const optionClasses = (isActive: boolean) =>
    isPlain
      ? "flex items-center gap-3 text-ink"
      : cn(
          "flex items-center gap-3 rounded-lg border p-3.5 transition-colors",
          isActive ? "border-primary bg-primary/5 text-ink" : "border-border bg-surface text-ink",
          !isReadOnly && !isActive && "hover:bg-muted",
        );

  const toggleOption = (optionId: string, isChecked: boolean) =>
    onChange?.(isChecked ? [...selected, optionId] : selected.filter((id) => id !== optionId));

  return (
    <fieldset
      id={`${baseId}-card`}
      className={
        isPlain
          ? "py-5 first:pt-0 last:pb-0"
          : cn(
              "rounded-xl border bg-surface p-6 shadow-xs transition-colors",
              error ? "border-danger ring-1 ring-danger/30" : "border-border",
            )
      }
    >
      <legend
        id={`${baseId}-legend`}
        className={cn("float-left mb-3 w-full font-semibold text-ink", isPlain ? "text-sm" : "text-base")}
      >
        <span className={isPlain ? undefined : "text-primary"}>{index + 1}.</span> {question.statement}
        {question.isRequired && <RequiredMark className="ml-1" />}
      </legend>

      {hint && <p className="clear-both mb-4 text-xs font-normal text-text-secondary">{hint}</p>}

      {question.type === "dropdown" ? (
        <div className="clear-both">
          <Select
            items={options.map(({ id, label }) => ({ value: id, label }))}
            disabled={isReadOnly}
            {...(isControlled && { value: selected[0] ?? null })}
            onValueChange={(value) => onChange?.(typeof value === "string" ? [value] : [])}
          >
            <SelectTrigger
              id={`${baseId}-select`}
              aria-labelledby={`${baseId}-legend`}
              aria-invalid={isInvalid}
              className={cn("w-full", isPlain && "sm:max-w-md", error && "border-danger")}
            >
              <SelectValue placeholder={SURVEY_ANSWER_TEXT.dropdownPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : question.type === "single_choice" ? (
        <RadioGroup
          aria-labelledby={`${baseId}-legend`}
          disabled={isReadOnly}
          {...(isControlled && { value: selected[0] ?? "" })}
          onValueChange={(value) => onChange?.([String(value)])}
          className="clear-both flex flex-col gap-2.5"
        >
          {options.map((option) => (
            <div key={option.id} className={optionClasses(selected[0] === option.id)}>
              <RadioGroupItem
                id={`${baseId}-${option.id}`}
                value={option.id}
                aria-invalid={isInvalid}
                className={cn(error && "border-danger")}
              />
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
                  aria-invalid={isInvalid}
                  className={cn(error && "border-danger")}
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
