import type { Prisma } from '../../../prisma/client.js';
import { VALIDATION_RESULT, type ValidationResult } from '../types/document-validation.enum.js';

export function buildValidationWhere(validation: ValidationResult): Prisma.AccessRequestWhereInput {
  if (validation === VALIDATION_RESULT.MANUAL_REVIEW) {
    return { OR: [{ documentValidation: { is: { result: validation } } }, { documentValidation: { is: null } }] };
  }
  return { documentValidation: { is: { result: validation } } };
}
