"use client";

import { ReportFilterSelect } from "@/modules/reports";
import {
  SURVEY_PERIOD_FILTER_ALL_LABEL,
  SURVEY_PERIOD_FILTER_HINT,
  SURVEY_PERIOD_FILTER_LABEL,
} from "../constants/survey-statistics.constants";
import type { SurveyPeriodFilterProps } from "../types/survey-component-props.types";

export function SurveyPeriodFilter({ periods, value, onChange }: SurveyPeriodFilterProps) {
  return (
    <div className="flex w-full flex-col gap-1 sm:w-72 sm:shrink-0">
      <ReportFilterSelect
        label={SURVEY_PERIOD_FILTER_LABEL}
        allLabel={SURVEY_PERIOD_FILTER_ALL_LABEL}
        options={periods.map((period) => ({ value: period, label: period }))}
        value={value}
        onChange={onChange}
      />
      <p className="px-1 text-xs text-text-secondary">{SURVEY_PERIOD_FILTER_HINT}</p>
    </div>
  );
}
