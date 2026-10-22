"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SURVEY_QUESTION_TYPE_LABELS, SURVEY_QUESTION_TYPES } from "../constants/survey-form.constants";
import { SURVEY_QUESTION_TYPE_ICONS } from "../constants/survey-question-icons.constants";
import type { SurveyQuestionTypeSelectProps } from "../types/survey-question-type-select-props.types";
import type { SurveyQuestionType } from "../types/survey.types";

const ITEMS = SURVEY_QUESTION_TYPES.map((type) => ({ value: type, label: SURVEY_QUESTION_TYPE_LABELS[type] }));

export function SurveyQuestionTypeSelect({ value, questionNumber, onChange }: SurveyQuestionTypeSelectProps) {
  const ValueIcon = SURVEY_QUESTION_TYPE_ICONS[value];

  return (
    <Select items={ITEMS} value={value} onValueChange={(next) => next && onChange(next as SurveyQuestionType)}>
      <SelectTrigger
        aria-label={`Tipo de la pregunta ${questionNumber}`}
        className="w-full cursor-pointer rounded-md border-border sm:w-52"
      >
        <ValueIcon className="size-4 text-ink-soft" aria-hidden="true" />
        <SelectValue className="text-sm text-ink" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="rounded-md bg-surface py-1 ring-border">
        {SURVEY_QUESTION_TYPES.map((type) => {
          const Icon = SURVEY_QUESTION_TYPE_ICONS[type];
          return (
            <SelectItem key={type} value={type} className="gap-2 px-3 py-2 text-ink-soft">
              <Icon className="size-4" aria-hidden="true" />
              {SURVEY_QUESTION_TYPE_LABELS[type]}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
