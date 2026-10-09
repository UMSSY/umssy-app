import {
  REGISTERED_USERS_REPORT_TYPES,
  type ReportType,
} from '../types/generated-report.types.js';
import type { ReportUserType } from '../types/report-user.types.js';

// Sin filtro de tipo de usuario, la exportación es la lista completa de usuarios.
export function toRegisteredUsersReportType(
  userType?: ReportUserType,
): ReportType {
  return userType
    ? REGISTERED_USERS_REPORT_TYPES[userType]
    : 'REGISTERED_USERS';
}
