"use client";

import { Calendar, Cpu, ListFilter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SELECT_ITEM_CONTRAST_CLASS, SELECT_POPUP_WIDE_CLASS } from "@/shared/constants/select.constants";
import { CAREER_OPTIONS, PERIOD_OPTIONS } from "../../constants/inbox-filters.constants";
import { ALL_VALIDATIONS_VALUE, VALIDATION_FILTER_OPTIONS } from "../../constants/automatic-validation.constants";
import type { InboxFiltersProps } from "../../types/inbox-filters-props.types";
import type { InboxPeriod } from "../../types/inbox-filters.types";

const TRIGGER_CLASS =
  "w-full gap-2 rounded-lg border-border bg-surface px-3 text-sm font-medium text-ink focus-visible:border-accent focus-visible:ring-interaction data-[size=default]:h-10 md:w-auto md:max-w-[300px]";
const SR_ONLY = "sr-only";

export function InboxFilters({ search, career, period, validation, onSearchChange, onCareerChange, onPeriodChange, onValidationChange }: InboxFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
      <div className="relative w-full md:w-[290px]">
        <Label htmlFor="inbox-search" className={SR_ONLY}>
          Buscar por nombre, C.I. o código SIS
        </Label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary" strokeWidth={1.75} aria-hidden="true" />
        <Input
          id="inbox-search"
          type="search"
          value={search}
          maxLength={100}
          autoComplete="off"
          placeholder="Nombre, CI o código SIS"
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-10 rounded-lg border-border bg-surface pr-3 pl-9 text-sm text-ink focus-visible:border-accent focus-visible:ring-interaction"
        />
      </div>

      <div>
        <Label htmlFor="inbox-validation" className={SR_ONLY}>
          Validación automática
        </Label>
        <Select items={VALIDATION_FILTER_OPTIONS} value={validation} onValueChange={(value) => onValidationChange(value ?? ALL_VALIDATIONS_VALUE)}>
          <SelectTrigger
            id="inbox-validation"
            title={VALIDATION_FILTER_OPTIONS.find((option) => option.value === validation)?.label}
            className={TRIGGER_CLASS}
          >
            <Cpu className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={SELECT_POPUP_WIDE_CLASS}>
            {VALIDATION_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CONTRAST_CLASS}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="inbox-career" className={SR_ONLY}>
          Carrera
        </Label>
        <Select items={CAREER_OPTIONS} value={career} onValueChange={(value) => onCareerChange(value ?? "all")}>
          <SelectTrigger id="inbox-career" title={CAREER_OPTIONS.find((option) => option.value === career)?.label} className={TRIGGER_CLASS}>
            <ListFilter className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={SELECT_POPUP_WIDE_CLASS}>
            {CAREER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CONTRAST_CLASS}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="inbox-period" className={SR_ONLY}>
          Período
        </Label>
        <Select items={PERIOD_OPTIONS} value={period} onValueChange={(value) => onPeriodChange((value ?? "all") as InboxPeriod)}>
          <SelectTrigger id="inbox-period" title={PERIOD_OPTIONS.find((option) => option.value === period)?.label} className={TRIGGER_CLASS}>
            <Calendar className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={SELECT_POPUP_WIDE_CLASS}>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CONTRAST_CLASS}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
