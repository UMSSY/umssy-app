import { USER_TYPE_LABELS } from '../constants/report-user-csv.constants.js';
import { DOCUMENT_TYPE_LABELS } from '../../../common/constants/document-type-labels.constants.js';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import type {
  RegisteredUserResponse,
  RejectedUserResponse,
  ReportDocumentType,
} from '../types/report-user.types.js';

const EMPTY_VALUE = '-';

export function formatReportDate(isoDate: string): string {
  if (Number.isNaN(new Date(isoDate).getTime())) {
    return EMPTY_VALUE;
  }

  const [year, month, day] = toBoliviaTime(isoDate).date.split('-');
  return `${day}/${month}/${year}`;
}

function toDocumentLabel(documentType: ReportDocumentType | null): string {
  return documentType ? DOCUMENT_TYPE_LABELS[documentType] : EMPTY_VALUE;
}

export function toRegisteredUserCsvRow(user: RegisteredUserResponse): string[] {
  return [
    user.fullName,
    user.email,
    USER_TYPE_LABELS[user.userType],
    user.identifier,
    toDocumentLabel(user.documentType),
    formatReportDate(user.registeredAt),
  ];
}

export function toRejectedUserCsvRow(user: RejectedUserResponse): string[] {
  return [
    user.fullName,
    user.email,
    USER_TYPE_LABELS[user.userType],
    user.identifier,
    toDocumentLabel(user.documentType),
    formatReportDate(user.registeredAt),
  ];
}
