"use client";

import { ReportFilterSelect } from "@/modules/reports";
import { SURVEY_PERIOD_FILTER_ALL_LABEL, SURVEY_PERIOD_FILTER_LABEL } from "../constants/survey-statistics.constants";
import type { SurveyPeriodFilterProps } from "../types/survey-component-props.types";

// Selector de semestre de las analíticas. Es el mismo componente del historial y los reportes, para que se sienta igual.
export function SurveyPeriodFilter({ periods, value, onChange }: SurveyPeriodFilterProps) {
  return (
    <ReportFilterSelect
      label={SURVEY_PERIOD_FILTER_LABEL}
      allLabel={SURVEY_PERIOD_FILTER_ALL_LABEL}
      options={periods.map((period) => ({ value: period, label: period }))}
      value={value}
      onChange={onChange}
    />
  );
}
