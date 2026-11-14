import { REPORT_PDF_TEXT } from '../constants/report-pdf.constants.js';
import { USER_TYPE_LABELS } from '../constants/report-user-csv.constants.js';
import type { RoleName } from '../../../common/enums/roles.enum.js';
import type {
  ReportPdfFilter,
  ReportPdfFiltersInput,
} from '../types/report-pdf.types.js';

const SECOND_SEMESTER_START_MONTH = '07';
const FIRST_SEMESTER_START_MONTH = '01';

export function getAcademicPeriodStartDate(period: string): string {
  const [semester, year] = period.split('-');
  const month =
    semester === 'II' ? SECOND_SEMESTER_START_MONTH : FIRST_SEMESTER_START_MONTH;
  return `01/${month}/${year}`;
}

export function buildReportPdfFilters(
  dateFilterLabel: string,
  filters: ReportPdfFiltersInput,
): ReportPdfFilter[] {
  const search = (filters.search ?? '').trim();
  return [
    {
      label: REPORT_PDF_TEXT.userTypeFilter,
      value: filters.userType
        ? (USER_TYPE_LABELS[filters.userType as RoleName] ?? filters.userType)
        : REPORT_PDF_TEXT.allUserTypes,
    },
    {
      label: dateFilterLabel,
      value: filters.period
        ? getAcademicPeriodStartDate(filters.period)
        : REPORT_PDF_TEXT.allDates,
    },
    {
      label: REPORT_PDF_TEXT.searchFilter,
      value: search ? `"${search}"` : REPORT_PDF_TEXT.emptySearch,
    },
  ];
}
