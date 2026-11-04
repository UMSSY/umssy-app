"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportFilterSelect } from "@/modules/reports";
import {
  ACADEMIC_PERIOD_FILTER_LABEL,
  ACADEMIC_PERIOD_FILTER_PLACEHOLDER,
  CLEAR_ACADEMIC_PERIOD_LABEL,
} from "../constants/survey-routes.constants";
import type { AcademicPeriodFilterProps } from "../types/survey-component-props.types";

export function AcademicPeriodFilter({ periods, value, onChange }: AcademicPeriodFilterProps) {
  return (
    <div className="relative w-full sm:w-72 sm:shrink-0">
      <ReportFilterSelect
        label={ACADEMIC_PERIOD_FILTER_LABEL}
        placeholder={ACADEMIC_PERIOD_FILTER_PLACEHOLDER}
        options={periods.map((period) => ({ value: period, label: period }))}
        value={value}
        onChange={onChange}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(undefined)}
          aria-label={CLEAR_ACADEMIC_PERIOD_LABEL}
          title={CLEAR_ACADEMIC_PERIOD_LABEL}
          className="absolute top-1/2 right-8 size-8 -translate-y-1/2 rounded-md text-text-secondary hover:bg-transparent hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
