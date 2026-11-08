import type { FileValidationRules } from '../../../common/types/file-validation-rules.type.js';

export const CV_VALIDATION_RULES: FileValidationRules = {
  allowedTypes: ['pdf'],
  maxSizeBytes: 5 * 1024 * 1024,
};

export const CV_DEFAULT_PAGE_SIZE = 5;
