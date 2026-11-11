"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QUESTION_TYPE_ITEMS, QUESTION_TYPE_OPTIONS, SURVEY_ARIA } from "../constants/survey-builder.constants";
import type { QuestionTypeSelectProps } from "../types/question-type-select-props.types";
import { isQuestionType } from "../utils/is-question-type";

const SELECTABLE_QUESTION_TYPE_OPTIONS = QUESTION_TYPE_OPTIONS.filter((option) => option.value !== "dropdown");

export function QuestionTypeSelect({ id, value, onChange }: QuestionTypeSelectProps) {
  const selected = QUESTION_TYPE_OPTIONS.find((option) => option.value === value) ?? QUESTION_TYPE_OPTIONS[0];
  const SelectedIcon = selected.icon;

  return (
    <Select
      items={QUESTION_TYPE_ITEMS}
      value={value}
      onValueChange={(nextValue) => {
        if (isQuestionType(nextValue)) onChange(nextValue);
      }}
    >
      <SelectTrigger
        id={id}
        aria-label={SURVEY_ARIA.questionType}
        className="h-11 w-full rounded-lg border-border-strong bg-surface px-3 text-sm text-ink data-[size=default]:h-11"
      >
        <SelectedIcon aria-hidden="true" className="text-accent" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="bg-surface p-1">
        {SELECTABLE_QUESTION_TYPE_OPTIONS.map(({ value: optionValue, label, icon: Icon }) => (
          <SelectItem
            key={optionValue}
            value={optionValue}
            variant="subtle"
            className="gap-2.5 py-2 pl-2 font-medium text-ink data-highlighted:bg-surface-soft data-selected:bg-accent/10 data-selected:font-semibold data-selected:text-accent data-selected:focus:bg-accent/10 data-selected:focus:text-accent data-selected:data-highlighted:bg-accent/10 data-selected:data-highlighted:text-accent"
          >
            <Icon aria-hidden="true" className="text-accent" />
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
