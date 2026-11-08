import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import type { FileValidationRules } from '../../../common/types/file-validation-rules.type.js';

export const APPOINTMENT_DOCUMENT_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;

export const APPOINTMENT_DOCUMENT_VALIDATION_RULES: FileValidationRules = {
  allowedTypes: ['pdf', 'png', 'jpg'],
  maxSizeBytes: 5 * 1024 * 1024,
};

export const APPOINTMENT_DOCUMENT_OPEN_STATUSES: readonly string[] = [
  AppointmentStatusTitle.CONFIRMED,
  AppointmentStatusTitle.LEGACY_CONFIRMED,
];
