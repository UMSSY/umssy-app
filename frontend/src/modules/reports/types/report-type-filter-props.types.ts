import type { ReportType } from "./report-type.types";

export interface ReportTypeFilterProps {
  value?: ReportType;
  onChange: (reportType?: ReportType) => void;
}
