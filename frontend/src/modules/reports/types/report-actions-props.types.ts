import type { AcademicPeriod } from "./academic-period.types";
import type { ReportExportFormat } from "./report-export-format.types";
import type { ReportExportScope } from "./report-export-scope.types";

export interface ReportActionsProps {
  onExport?: (format: ReportExportFormat, scope: ReportExportScope) => void;
  isExporting?: boolean;
  hasResults?: boolean;
  period?: AcademicPeriod;
  onPeriodChange: (period?: AcademicPeriod) => void;
}
