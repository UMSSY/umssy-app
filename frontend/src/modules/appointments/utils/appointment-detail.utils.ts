import { toBoliviaTime } from "@/shared/utils/date-time";
import {
  APPOINTMENT_DOCUMENT_FALLBACK_TYPE_LABEL,
  APPOINTMENT_DOCUMENT_TYPE_LABELS,
} from "../constants/appointment-document.constants";
import {
  APPOINTMENT_MONTH_LABELS,
  APPOINTMENT_WEEKDAY_LABELS,
} from "../constants/appointments.constants";

const formatDayMonthYear = (value: string): string => {
  const { day, month, year } = toBoliviaTime(value);
  return `${day} de ${APPOINTMENT_MONTH_LABELS[month - 1]} de ${year}`;
};

export const formatAppointmentDate = (value: string): string =>
  `${APPOINTMENT_WEEKDAY_LABELS[toBoliviaTime(value).weekday - 1]} ${formatDayMonthYear(value)}`;

export const formatAppointmentRequestedAt = (value: string): string =>
  `${formatDayMonthYear(value)}, ${toBoliviaTime(value).time}`;

export const getAppointmentDocumentTypeLabel = (mimeType: string): string =>
  APPOINTMENT_DOCUMENT_TYPE_LABELS[mimeType] ?? APPOINTMENT_DOCUMENT_FALLBACK_TYPE_LABEL;
