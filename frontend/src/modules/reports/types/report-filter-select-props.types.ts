import type { ReportFilterOption } from "./report-filter-option.types";

export interface ReportFilterSelectProps<TValue extends string> {
  label: string;
  allLabel?: string;
  placeholder?: string;
  options: ReportFilterOption<TValue>[];
  value?: TValue;
  onChange: (value?: TValue) => void;
  disabled?: boolean;
}
