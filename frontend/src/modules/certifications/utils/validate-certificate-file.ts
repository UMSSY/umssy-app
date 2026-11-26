import { DOCUMENT_ALLOWED_EXTENSIONS, DOCUMENT_ALLOWED_TYPES } from "@/shared/constants/file-upload.constants";

import { FILE_VALIDATION_MESSAGES } from "@/modules/profile";
import { validateFile } from "@/modules/profile";

export function validateCertificateFile(file: File): string | null {
  return validateFile(
    file,
    DOCUMENT_ALLOWED_TYPES,
    DOCUMENT_ALLOWED_EXTENSIONS,
    FILE_VALIDATION_MESSAGES.invalidCertificateType,
  );
}
