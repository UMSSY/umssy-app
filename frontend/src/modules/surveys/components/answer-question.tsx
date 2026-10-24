"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SURVEY_RESPONSE_TEXT } from "../constants/survey-response.constants";
import type { AnswerQuestionProps } from "../types/survey-response-props.types";
import { RequiredMark } from "./required-mark";

export function AnswerQuestion({ question, value, error, onChange }: AnswerQuestionProps) {
  const { id, position, statement, type, isRequired, options } = question;
  const baseId = `answer-${id}`;
  const legendId = `${baseId}-legend`;
  const errorId = `${baseId}-error`;
  const isInvalid = Boolean(error);

  const toggleOption = (optionId: string, checked: boolean) =>
    onChange(id, checked ? [...value, optionId] : value.filter((selected) => selected !== optionId));

  return (
    <fieldset aria-describedby={isInvalid ? errorId : undefined} className="py-5 first:pt-0 last:pb-0">
      <legend id={legendId} className="float-left mb-3 w-full font-semibold text-ink">
        {position}. {statement}
        {isRequired && <RequiredMark className="ml-1" />}
      </legend>

      {type === "single_choice" && (
        <RadioGroup
          aria-labelledby={legendId}
          value={value[0] ?? null}
          onValueChange={(selected) => onChange(id, [selected as string])}
          className="clear-both gap-3"
        >
          {options.map((option) => (
            <div key={option.id} className="flex items-center gap-3">
              <RadioGroupItem id={`${baseId}-${option.id}`} value={option.id} aria-invalid={isInvalid} />
              <Label htmlFor={`${baseId}-${option.id}`} className="font-normal text-ink">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {type === "multiple_choice" && (
        <div className="clear-both flex flex-col gap-3">
          <p className="text-xs text-text-secondary">{SURVEY_RESPONSE_TEXT.multipleChoiceHint}</p>
          {options.map((option) => (
            <div key={option.id} className="flex items-center gap-3">
              <Checkbox
                id={`${baseId}-${option.id}`}
                checked={value.includes(option.id)}
                aria-invalid={isInvalid}
                onCheckedChange={(checked) => toggleOption(option.id, checked)}
              />
              <Label htmlFor={`${baseId}-${option.id}`} className="font-normal text-ink">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      )}

      {isInvalid && (
        <p id={errorId} role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
