import {
  AUTO_APPROVAL_THRESHOLD,
  AUTO_REJECTION_THRESHOLD,
  FIELD_WEIGHTS,
  LOW_LEGIBILITY_CONFIDENCE,
  VALIDATION_REASONS,
} from '../constants/automatic-validation.constants.js';
import { FIELD_RESULT, VALIDATION_FIELD, VALIDATION_RESULT } from '../types/document-validation.enum.js';
import type { DocumentReading } from '../types/document-reading.types.js';
import type { DeclaredData, DocumentEvaluation, ValidationFieldOutcome } from '../types/document-validation.types.js';
import { foldAccents } from './fold-accents.js';

const tokens = (text: string) => foldAccents(text).replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/).filter(Boolean);

function tokenCoverage(declared: string, read: string | null): number {
  const expected = tokens(declared);
  if (expected.length === 0 || !read) return 0;
  const found = new Set(tokens(read));
  return expected.filter((word) => found.has(word)).length / expected.length;
}

const sameText = (declared: string, read: string | null) => read !== null && tokens(declared).join(' ') === tokens(read).join(' ');

function manualReviewReason(confidence: number, nameOk: { first: boolean; last: boolean }, careerOk: boolean, yearOk: boolean) {
  if (confidence < LOW_LEGIBILITY_CONFIDENCE) return VALIDATION_REASONS.LOW_LEGIBILITY;
  if (!nameOk.last) return VALIDATION_REASONS.LAST_NAME_MISMATCH;
  if (!nameOk.first) return VALIDATION_REASONS.FIRST_NAME_MISMATCH;
  if (!careerOk) return VALIDATION_REASONS.CAREER_MISMATCH;
  if (!yearOk) return VALIDATION_REASONS.YEAR_MISMATCH;
  return VALIDATION_REASONS.BELOW_THRESHOLD;
}

export function evaluateDocumentReading(declared: DeclaredData, reading: DocumentReading): DocumentEvaluation {
  const confidence = Math.min(1, Math.max(0, reading.confidence));
  const nameCoverage = tokenCoverage(`${declared.firstName} ${declared.lastName}`, reading.fullName);
  const nameOk = {
    first: tokenCoverage(declared.firstName, reading.fullName) === 1,
    last: tokenCoverage(declared.lastName, reading.fullName) === 1,
  };
  const careerOk = sameText(declared.career, reading.career);
  const yearOk = reading.graduationYear === declared.graduationYear;

  const fields: ValidationFieldOutcome[] = [
    { field: VALIDATION_FIELD.FULL_NAME, read: reading.fullName, result: nameOk.first && nameOk.last ? FIELD_RESULT.MATCH : FIELD_RESULT.MISMATCH },
    { field: VALIDATION_FIELD.CAREER, read: reading.career, result: careerOk ? FIELD_RESULT.MATCH : FIELD_RESULT.MISMATCH },
    {
      field: VALIDATION_FIELD.GRADUATION_YEAR,
      read: reading.graduationYear === null ? null : String(reading.graduationYear),
      result: yearOk ? FIELD_RESULT.MATCH : FIELD_RESULT.MISMATCH,
    },
    { field: VALIDATION_FIELD.ID_CARD_NUMBER, read: null, result: FIELD_RESULT.NOT_COMPARED },
    { field: VALIDATION_FIELD.SIS_CODE, read: null, result: FIELD_RESULT.NOT_COMPARED },
  ];

  const weighted = FIELD_WEIGHTS.fullName * nameCoverage + FIELD_WEIGHTS.career * Number(careerOk) + FIELD_WEIGHTS.graduationYear * Number(yearOk);
  const score = Math.round(weighted * confidence * 100);
  const matchScore = reading.isDiploma ? score : Math.min(score, AUTO_REJECTION_THRESHOLD - 1);

  if (!reading.isDiploma) {
    return { result: VALIDATION_RESULT.AUTO_REJECTED, matchScore, reason: VALIDATION_REASONS.NOT_A_DIPLOMA, fields };
  }
  if (matchScore < AUTO_REJECTION_THRESHOLD) {
    return { result: VALIDATION_RESULT.AUTO_REJECTED, matchScore, reason: VALIDATION_REASONS.ILLEGIBLE, fields };
  }
  if (matchScore >= AUTO_APPROVAL_THRESHOLD) {
    return { result: VALIDATION_RESULT.AUTO_APPROVED, matchScore, reason: null, fields };
  }
  return { result: VALIDATION_RESULT.MANUAL_REVIEW, matchScore, reason: manualReviewReason(confidence, nameOk, careerOk, yearOk), fields };
}
