import {
  CERTIFICATE_ALLOWED_EXTENSIONS,
  CERTIFICATE_ALLOWED_TYPES,
  FILE_VALIDATION_MESSAGES,
  validateFile,
} from "@/modules/profile";
import {
  APPOINTMENT_DOCUMENT_FALLBACK_TYPE_LABEL,
  APPOINTMENT_DOCUMENT_TYPE_LABELS,
} from "../constants/appointment-document.constants";

export const validateAppointmentDocument = (file: File): string | null =>
  validateFile(
    file,
    CERTIFICATE_ALLOWED_TYPES,
    CERTIFICATE_ALLOWED_EXTENSIONS,
    FILE_VALIDATION_MESSAGES.invalidCertificateType,
  );

const getFileExtension = (fileName: string): string | null => {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 && dotIndex < fileName.length - 1 ? fileName.slice(dotIndex + 1) : null;
};

export const getAppointmentDocumentTypeLabel = (file: File): string =>
  APPOINTMENT_DOCUMENT_TYPE_LABELS[file.type] ??
  getFileExtension(file.name)?.toUpperCase() ??
  APPOINTMENT_DOCUMENT_FALLBACK_TYPE_LABEL;
