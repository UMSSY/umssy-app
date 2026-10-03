import { CV_ALLOWED_EXTENSIONS, CV_ALLOWED_TYPES } from "../config/file-upload.config";
import { FILE_VALIDATION_MESSAGES } from "../config/file-validation-messages.config";
import { validateFile } from "./validate-file";

export function validateCvFile(file: File): string | null {
  return validateFile(
    file,
    CV_ALLOWED_TYPES,
    CV_ALLOWED_EXTENSIONS,
    FILE_VALIDATION_MESSAGES.invalidCvType,
  );
}
