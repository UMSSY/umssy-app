"use client";

import { REPORT_TYPE_FILTER_OPTIONS, REPORT_TYPE_LABELS } from "../constants/generated-report.constants";
import type { ReportType } from "../types/generated-report.types";
import { ReportFilterSelect } from "./report-filter-select";

interface ReportTypeFilterProps {
  value?: ReportType;
  onChange: (reportType?: ReportType) => void;
}

const OPTIONS = REPORT_TYPE_FILTER_OPTIONS.map((reportType) => ({
  value: reportType,
  label: REPORT_TYPE_LABELS[reportType],
}));

export function ReportTypeFilter({ value, onChange }: ReportTypeFilterProps) {
  return (
    <ReportFilterSelect label="Tipo de reporte" allLabel="Todos" options={OPTIONS} value={value} onChange={onChange} />
  );
}
