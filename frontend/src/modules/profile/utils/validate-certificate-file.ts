import {
  CERTIFICATE_ALLOWED_EXTENSIONS,
  CERTIFICATE_ALLOWED_TYPES,
} from "../config/file-upload.config";
import { FILE_VALIDATION_MESSAGES } from "../config/file-validation-messages.config";
import { validateFile } from "./validate-file";

export function validateCertificateFile(file: File): string | null {
  return validateFile(
    file,
    CERTIFICATE_ALLOWED_TYPES,
    CERTIFICATE_ALLOWED_EXTENSIONS,
    FILE_VALIDATION_MESSAGES.invalidCertificateType,
  );
}
