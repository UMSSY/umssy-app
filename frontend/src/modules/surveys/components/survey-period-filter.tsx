"use client";

import { ReportFilterSelect } from "@/modules/reports";

import type { SurveyPeriodFilterProps } from "../types/survey-period-filter-props.types";

export function SurveyPeriodFilter({ periods, value, onChange }: SurveyPeriodFilterProps) {
  return (
    <div className="flex w-full flex-col gap-1 sm:w-72 sm:shrink-0">
      <ReportFilterSelect
        label={"Gestión académica"}
        allLabel={"Todos"}
        options={periods.map((period) => ({ value: period, label: period }))}
        value={value}
        onChange={onChange}
      />
      <p className="px-1 text-xs text-text-secondary">{"Semestre en que se recibieron las respuestas"}</p>
    </div>
  );
}
