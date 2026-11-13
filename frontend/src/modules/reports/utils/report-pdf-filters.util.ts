import { ROLE_LABELS } from "@/shared/constants/roles.constants";
import type { RoleTag } from "@/modules/auth";
import type { AcademicPeriod } from "../types/registered-user.types";
import type { ReportPdfFilter } from "../types/report-pdf.types";

const ALL_USER_TYPES_LABEL = "Todos";
const ALL_DATES_LABEL = "Todas las fechas";
const EMPTY_SEARCH_LABEL = "ninguna";
const SECOND_SEMESTER_START_MONTH = "07";
const FIRST_SEMESTER_START_MONTH = "01";

export function getAcademicPeriodStartDate(period: AcademicPeriod): string {
  const [semester, year] = period.split("-");
  const month = semester === "II" ? SECOND_SEMESTER_START_MONTH : FIRST_SEMESTER_START_MONTH;
  return `01/${month}/${year}`;
}

export function buildReportPdfFilters(
  dateFilterLabel: string,
  userType?: RoleTag,
  period?: AcademicPeriod,
  search?: string,
): ReportPdfFilter[] {
  const trimmedSearch = search?.trim();

  return [
    { label: "Tipo de usuario", value: userType ? ROLE_LABELS[userType] : ALL_USER_TYPES_LABEL },
    { label: dateFilterLabel, value: period ? getAcademicPeriodStartDate(period) : ALL_DATES_LABEL },
    { label: "Búsqueda", value: trimmedSearch ? `"${trimmedSearch}"` : EMPTY_SEARCH_LABEL },
  ];
}
