"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { es } from "react-day-picker/locale";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SURVEY_ARIA, SURVEY_TEXT } from "../constants/survey-builder.constants";
import type { SurveyDateFieldProps } from "../types/survey-component-props.types";
import { formatDisplayDate, toCalendarDate, toDateValue } from "../utils/survey-dates";
import { FieldErrorMessage } from "./field-error-message";
import { RequiredMark } from "./required-mark";

export function SurveyDateField({ id, label, value, minDate, error, onChange }: SurveyDateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = toCalendarDate(value);
  const errorId = `${id}-error`;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(toDateValue(date));
    setOpen(false);
  };

  return (
    <div className="min-w-0">
      <Label htmlFor={id} className="mb-1.5 gap-1 text-xs font-medium text-ink-soft">
        {label}
        <RequiredMark />
      </Label>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              id={id}
              variant="outline"
              aria-label={`${label}: ${value ? formatDisplayDate(value) : SURVEY_TEXT.selectDate}`}
              aria-required="true"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="h-10 w-full justify-between rounded-lg border-border-strong bg-surface px-3 font-normal text-ink hover:bg-surface-soft"
            />
          }
        >
          <span className={cn("truncate", !value && "text-text-secondary")}>
            {value ? formatDisplayDate(value) : SURVEY_TEXT.selectDate}
          </span>
          <CalendarDays aria-hidden="true" className="text-text-secondary" />
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="w-auto sm:max-w-fit">
          <DialogTitle className="text-base font-semibold text-ink">{SURVEY_ARIA.pickDate(label)}</DialogTitle>
          <Calendar
            mode="single"
            locale={es}
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected ?? minDate}
            disabled={{ before: minDate }}
            className="rounded-lg border border-border [--cell-size:--spacing(9)]"
          />
        </DialogContent>
      </Dialog>
      <FieldErrorMessage id={errorId} message={error} />
    </div>
  );
}
