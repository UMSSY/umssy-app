"use client";

import { useState } from "react";
import { CalendarDaysIcon, CircleAlertIcon } from "lucide-react";
import { es } from "react-day-picker/locale";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { DateField } from "@/shared/components/date-field";
import { Input } from "@/components/ui/input";
import { TimeSelect } from "./time-select";
import { toBoliviaTime, toUtcIso } from "@/shared/utils/date-time";
import { cn } from "cn";
import {
  FORM_TEXT,
  MAX_REPEAT_WEEKS,
  REPEAT_INTERVAL_DAYS,
  REPEAT_WEEKLY_TEXT,
  REQUIRED_MESSAGES,
} from "../constants/availability.constants";
import type { BlockFormErrors } from "../types/block-form-errors.types";
import type { BlockFormField } from "../types/block-form-field.types";
import type { BlockFormProps } from "../types/block-form-props.types";
import type { CreateAvailabilityBlockInput } from "../types/create-availability-block-input.types";
import { validateBlock } from "../utils/block-validation";
import {
  addDaysToDateString,
  formatDayAndMonth,
  formatLongDate,
  getBoliviaToday,
  toCalendarDate,
  toDateString,
} from "../utils/calendar-date";
import { getPastTimeLimit, isEndTimeDisabled, isStartTimeDisabled } from "../utils/time-options";

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-ink-soft">
      *
    </span>
  );
}

export function BlockForm({
  mode,
  initialValues,
  isSubmitting = false,
  disabled = false,
  submitError,
  onSubmit,
  onCancel,
  onValuesChange,
}: BlockFormProps) {
  const [today] = useState(getBoliviaToday);
  const [date, setDate] = useState(() =>
    initialValues?.startAt ? toBoliviaTime(initialValues.startAt).date : "",
  );
  const [startTime, setStartTime] = useState(() =>
    initialValues?.startAt ? toBoliviaTime(initialValues.startAt).time : "",
  );
  const [endTime, setEndTime] = useState(() =>
    initialValues?.endAt ? toBoliviaTime(initialValues.endAt).time : "",
  );
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState("");
  const [errors, setErrors] = useState<BlockFormErrors>({});

  const text = FORM_TEXT[mode];
  const selectedDate = date ? toCalendarDate(date) : undefined;
  const timeLimits = { pastLimit: getPastTimeLimit(date), startTime, endTime };
  const minRepeatUntil = date ? addDaysToDateString(date, REPEAT_INTERVAL_DAYS) : "";
  const maxRepeatUntil = date ? addDaysToDateString(date, MAX_REPEAT_WEEKS * 7) : "";
  const selectedRepeatUntil = repeatUntil ? toCalendarDate(repeatUntil) : undefined;

  const clearErrors = (...fields: BlockFormField[]) => {
    setErrors((prev) => {
      const next = { ...prev };
      fields.forEach((field) => delete next[field]);
      return next;
    });
  };

  const handleDateSelect = (day?: Date) => {
    onValuesChange?.();
    const nextDate = day ? toDateString(day) : "";
    const pastLimit = getPastTimeLimit(nextDate);
    setDate(nextDate);
    if (startTime && isStartTimeDisabled(startTime, { pastLimit, startTime: "", endTime: "" })) setStartTime("");
    if (endTime && isEndTimeDisabled(endTime, { pastLimit, startTime: "", endTime: "" })) setEndTime("");
    const nextMinRepeatUntil = nextDate ? addDaysToDateString(nextDate, REPEAT_INTERVAL_DAYS) : "";
    const nextMaxRepeatUntil = nextDate ? addDaysToDateString(nextDate, MAX_REPEAT_WEEKS * 7) : "";
    if (repeatUntil && (repeatUntil < nextMinRepeatUntil || repeatUntil > nextMaxRepeatUntil)) {
      setRepeatUntil("");
    }
    clearErrors("date", "startAt");
  };

  const handleStartChange = (value: string) => {
    onValuesChange?.();
    setStartTime(value);
    clearErrors("startAt", "endAt");
  };

  const handleEndChange = (value: string) => {
    onValuesChange?.();
    setEndTime(value);
    clearErrors("endAt");
  };

  const handleRepeatWeeklyChange = (checked: boolean) => {
    onValuesChange?.();
    setRepeatWeekly(checked);
    if (!checked) {
      setRepeatUntil("");
      clearErrors("repeatUntil");
    }
  };

  const handleRepeatUntilSelect = (day?: Date) => {
    onValuesChange?.();
    setRepeatUntil(day ? toDateString(day) : "");
    clearErrors("repeatUntil");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missing: BlockFormErrors = {};
    if (!date) missing.date = REQUIRED_MESSAGES.date;
    if (!startTime) missing.startAt = REQUIRED_MESSAGES.startAt;
    if (!endTime) missing.endAt = REQUIRED_MESSAGES.endAt;
    if (repeatWeekly && !repeatUntil) missing.repeatUntil = REQUIRED_MESSAGES.repeatUntil;
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      return;
    }

    const values: CreateAvailabilityBlockInput = {
      startAt: toUtcIso(date, startTime),
      endAt: toUtcIso(date, endTime),
    };
    if (repeatWeekly) {
      values.repeatWeekly = true;
      values.repeatUntil = repeatUntil;
    }

    const validationErrors = validateBlock(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSubmit(values);
  };

  return (
    <Card
      className={cn(
        "w-full rounded-lg border border-border bg-surface shadow-none [--card-spacing:--spacing(6)]",
        mode === "edit" && "ring-1 ring-border-strong",
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg font-bold">{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate className="contents">
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-6">
            <Field data-invalid={errors.date ? true : undefined}>
              <FieldLabel htmlFor="date" className="font-semibold">
                {text.dateLabel}
                <RequiredMark />
              </FieldLabel>
              <div className="relative">
                {mode === "edit" ? (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-10 items-center rounded-lg border border-transparent px-3 text-sm font-medium",
                        "bg-interaction text-ink",
                      )}
                    >
                      {date ? formatDayAndMonth(date) : ""}
                    </span>
                    <DateField
                      id="date"
                      value={date}
                      readOnly
                      aria-invalid={errors.date ? true : undefined}
                      aria-describedby={errors.date ? "date-error" : undefined}
                      className="absolute inset-0 size-full cursor-default opacity-0"
                    />
                  </>
                ) : (
                  <>
                    <Input
                      id="date"
                      readOnly
                      value={date ? formatLongDate(date) : ""}
                      placeholder="Selecciona una fecha"
                      aria-invalid={errors.date ? true : undefined}
                      aria-describedby={errors.date ? "date-error" : "date-hint"}
                      className="h-10 pr-10"
                    />
                    <CalendarDaysIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                  </>
                )}
              </div>
              {mode !== "edit" && (
                <>
                  <Calendar
                    mode="single"
                    required
                    locale={es}
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    defaultMonth={selectedDate ?? today}
                    disabled={{ before: today }}
                    className="w-full rounded-lg border [--cell-size:--spacing(7)] sm:[--cell-size:--spacing(9)]"
                  />
                  <FieldDescription id="date-hint" className="text-xs">
                    Los días anteriores a hoy no se pueden elegir.
                  </FieldDescription>
                </>
              )}
              {errors.date && <FieldError id="date-error">{errors.date}</FieldError>}
            </Field>

            <FieldGroup
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <Field data-invalid={errors.startAt ? true : undefined}>
                <FieldLabel htmlFor="startAt" className="font-semibold">
                  {text.startLabel}
                  <RequiredMark />
                </FieldLabel>
                <TimeSelect
                  id="startAt"
                  value={startTime}
                  onValueChange={handleStartChange}
                  invalid={Boolean(errors.startAt)}
                  describedBy={errors.startAt ? "startAt-error" : undefined}
                  disabled={disabled}
                  isOptionHidden={(time) => isStartTimeDisabled(time, timeLimits)}
                />
                {errors.startAt && <FieldError id="startAt-error">{errors.startAt}</FieldError>}
              </Field>

              <Field data-invalid={errors.endAt ? true : undefined}>
                <FieldLabel htmlFor="endAt" className="font-semibold">
                  {text.endLabel}
                  <RequiredMark />
                </FieldLabel>
                <TimeSelect
                  id="endAt"
                  value={endTime}
                  onValueChange={handleEndChange}
                  invalid={Boolean(errors.endAt)}
                  describedBy={errors.endAt ? "endAt-error" : undefined}
                  disabled={disabled}
                  isOptionHidden={(time) => isEndTimeDisabled(time, timeLimits)}
                />
                {errors.endAt && <FieldError id="endAt-error">{errors.endAt}</FieldError>}
              </Field>

              {mode !== "edit" && (
                <FieldDescription className="col-span-1 text-xs sm:col-span-2">
                  La hora de fin debe ser posterior a la de inicio.
                </FieldDescription>
              )}
            </FieldGroup>

            {mode !== "edit" && (
              <Field>
                <Label className="flex items-center gap-2 font-semibold">
                  <Checkbox
                    checked={repeatWeekly}
                    onCheckedChange={(checked) => handleRepeatWeeklyChange(checked === true)}
                    disabled={disabled}
                  />
                  {REPEAT_WEEKLY_TEXT.checkboxLabel}
                </Label>
                <FieldDescription className="text-xs">{REPEAT_WEEKLY_TEXT.hint}</FieldDescription>
              </Field>
            )}

            {mode !== "edit" && repeatWeekly && (
              <Field
                role="group"
                aria-label={REPEAT_WEEKLY_TEXT.untilLabel}
                data-invalid={errors.repeatUntil ? true : undefined}
              >
                <FieldLabel className="font-semibold">
                  {REPEAT_WEEKLY_TEXT.untilLabel}
                  <RequiredMark />
                </FieldLabel>
                <Calendar
                  mode="single"
                  locale={es}
                  selected={selectedRepeatUntil}
                  onSelect={handleRepeatUntilSelect}
                  defaultMonth={selectedRepeatUntil ?? selectedDate ?? today}
                  disabled={
                    date
                      ? [{ before: toCalendarDate(minRepeatUntil) }, { after: toCalendarDate(maxRepeatUntil) }]
                      : true
                  }
                  className="w-full rounded-lg border [--cell-size:--spacing(7)] sm:[--cell-size:--spacing(9)]"
                />
                {errors.repeatUntil && <FieldError id="repeatUntil-error">{errors.repeatUntil}</FieldError>}
              </Field>
            )}
          </div>

          {submitError && (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>{submitError}</AlertTitle>
            </Alert>
          )}
        </CardContent>

        <CardFooter
          className={cn(
            "flex-col-reverse gap-3 border-t border-border bg-transparent",
            mode === "edit" ? "items-stretch" : "sm:flex-row sm:justify-end",
          )}
        >
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={cn("w-full", mode !== "edit" && "sm:w-auto")}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="lg"
            className={cn(
              "w-full bg-primary text-primary-foreground hover:bg-brand-hover",
              mode !== "edit" && "sm:w-auto",
            )}
            disabled={isSubmitting || disabled}
          >
            {isSubmitting ? "Guardando..." : text.submit}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
