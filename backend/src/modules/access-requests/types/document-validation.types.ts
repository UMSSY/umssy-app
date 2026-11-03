import type { FieldResult, ValidationField, ValidationResult } from './document-validation.enum.js';

export interface ValidationFieldOutcome {
  field: ValidationField;
  read: string | null;
  result: FieldResult;
}

export interface DocumentEvaluation {
  result: Exclude<ValidationResult, 'queued'>;
  matchScore: number;
  reason: string | null;
  fields: ValidationFieldOutcome[];
}

export interface DeclaredData {
  firstName: string;
  lastName: string;
  career: string;
  graduationYear: number;
}
