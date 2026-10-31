"use client";

import { Calendar, ListFilter, UserRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/shared/components/date-field";
import { SELECT_ITEM_CONTRAST_CLASS, SELECT_POPUP_WIDE_CLASS } from "@/shared/constants/select.constants";
import { ACTION_OPTIONS, ALL_VALUE } from "../../constants/audit-log-filters.constants";
import type { AuditAction } from "../../types/audit-event.types";
import type { AuditFilterFieldsProps } from "../../types/audit-log-extras-props.types";

const LABEL_CLASS = "text-xs font-medium text-text-secondary";
const TRIGGER_CLASS = "w-full gap-2 rounded-lg border-border bg-surface px-3 text-sm font-medium text-ink focus-visible:border-accent focus-visible:ring-interaction";
const DATE_CLASS = "w-full min-w-36 rounded-lg border-border bg-surface text-sm text-ink";
const COMPLETE_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Campos compartidos por la barra de escritorio y el panel móvil
export function AuditFilterFields({ idPrefix, values, responsibles, periodError, onActionChange, onResponsibleChange, onFromChange, onToChange }: AuditFilterFieldsProps) {
  const responsibleOptions = [{ value: ALL_VALUE, label: "Todos" }, ...responsibles.map((person) => ({ value: person.id, label: person.name }))];

  return (
    <>
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor={`${idPrefix}-action`} className={LABEL_CLASS}>
          Acción
        </Label>
        <Select items={ACTION_OPTIONS} value={values.action || ALL_VALUE} onValueChange={(value) => onActionChange(!value || value === ALL_VALUE ? "" : (value as AuditAction))}>
          <SelectTrigger id={`${idPrefix}-action`} className={TRIGGER_CLASS}>
            <ListFilter className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={SELECT_POPUP_WIDE_CLASS}>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CONTRAST_CLASS}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor={`${idPrefix}-responsible`} className={LABEL_CLASS}>
          Responsable
        </Label>
        <Select items={responsibleOptions} value={values.responsibleId || ALL_VALUE} onValueChange={(value) => onResponsibleChange(!value || value === ALL_VALUE ? "" : String(value))}>
          <SelectTrigger id={`${idPrefix}-responsible`} className={TRIGGER_CLASS}>
            <UserRound className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={SELECT_POPUP_WIDE_CLASS}>
            {responsibleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CONTRAST_CLASS}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-1">
        <legend className={`${LABEL_CLASS} mb-1 flex items-center gap-1`}>
          <Calendar className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          Período
        </legend>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Label htmlFor={`${idPrefix}-from`} className="sr-only">
              Desde
            </Label>
            <DateField
              id={`${idPrefix}-from`}
              value={values.from}
              max={COMPLETE_DATE.test(values.to) ? values.to : undefined}
              aria-invalid={Boolean(periodError)}
              onValueChange={onFromChange}
              className={DATE_CLASS}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Label htmlFor={`${idPrefix}-to`} className="sr-only">
              Hasta
            </Label>
            <DateField
              id={`${idPrefix}-to`}
              value={values.to}
              min={COMPLETE_DATE.test(values.from) ? values.from : undefined}
              aria-invalid={Boolean(periodError)}
              onValueChange={onToChange}
              className={DATE_CLASS}
            />
          </div>
        </div>
        {periodError ? (
          <p role="alert" className="text-xs text-danger">
            {periodError}
          </p>
        ) : null}
      </fieldset>
    </>
  );
}
