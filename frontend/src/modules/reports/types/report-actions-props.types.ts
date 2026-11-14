import type { AcademicPeriod } from "./registered-user.types";
import type { ReportExportFormat, ReportExportScope } from "./report-export.types";

export interface ReportActionsProps {
  onExport?: (format: ReportExportFormat, scope: ReportExportScope) => void;
  isExporting?: boolean;
  hasResults?: boolean;
  period?: AcademicPeriod;
  onPeriodChange: (period?: AcademicPeriod) => void;
}
