"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SURVEY_TEXT } from "../constants/survey-builder.constants";
import type { PreviewQuestionProps } from "../types/survey-component-props.types";
import { RequiredMark } from "./required-mark";

export function PreviewQuestion({ question, index }: PreviewQuestionProps) {
  const baseId = `preview-${question.id}`;
  const statement = (question.statement ?? "").trim() || SURVEY_TEXT.untitledQuestion;
  const options = (question.options ?? []).map((option, optionIndex) => ({
    id: option.id,
    value: option.id,
    label: (option.label ?? "").trim() || SURVEY_TEXT.optionPlaceholder(optionIndex + 1),
  }));

  return (
    <fieldset className="rounded-lg border border-border bg-surface p-5">
      <legend id={`${baseId}-legend`} className="float-left mb-3 w-full text-sm font-medium text-ink">
        {index + 1}. {statement}
        {question.isRequired && <RequiredMark className="ml-1" />}
      </legend>

      {question.type === "single_choice" && (
        <RadioGroup aria-labelledby={`${baseId}-legend`} className="clear-both gap-3">
          {options.map((option) => (
            <div key={option.id} className="flex items-center gap-3">
              <RadioGroupItem id={`${baseId}-${option.id}`} value={option.value} />
              <Label htmlFor={`${baseId}-${option.id}`} className="font-normal text-ink">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.type === "multiple_choice" && (
        <div className="clear-both flex flex-col gap-3">
          {options.map((option) => (
            <div key={option.id} className="flex items-center gap-3">
              <Checkbox id={`${baseId}-${option.id}`} />
              <Label htmlFor={`${baseId}-${option.id}`} className="font-normal text-ink">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}
