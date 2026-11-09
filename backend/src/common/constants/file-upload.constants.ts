import type { FileValidationRules } from '../types/file-validation-rules.type.js';

export const MAX_FILE_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_VALIDATION_RULES: FileValidationRules = {
  allowedTypes: ['pdf', 'png', 'jpg'],
  maxSizeBytes: 5 * 1024 * 1024,
};
