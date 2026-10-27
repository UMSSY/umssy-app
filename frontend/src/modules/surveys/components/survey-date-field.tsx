"use client";

import { Label } from "@/components/ui/label";
import { DateField } from "@/shared/components/date-field";
import type { SurveyDateFieldProps } from "../types/survey-component-props.types";
import { toDateValue } from "../utils/survey-dates";
import { FieldErrorMessage } from "./field-error-message";
import { RequiredMark } from "./required-mark";

export function SurveyDateField({ id, label, value, minDate, error, onChange }: SurveyDateFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="min-w-0">
      <Label htmlFor={id} className="mb-1.5 gap-1 text-xs font-medium text-ink-soft">
        {label}
        <RequiredMark />
      </Label>
      <DateField
        id={id}
        value={value ?? ""}
        min={toDateValue(minDate)}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onValueChange={onChange}
        className="h-10 rounded-lg border-border-strong bg-surface"
      />
      <FieldErrorMessage id={errorId} message={error} />
    </div>
  );
}
