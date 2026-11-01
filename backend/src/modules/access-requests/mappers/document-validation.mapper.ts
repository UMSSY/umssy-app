import type { Prisma } from '../../../prisma/client.js';
import type { ValidationField } from '../types/document-validation.enum.js';
import type { ValidationFieldOutcome } from '../types/document-validation.types.js';

interface ValidationSummaryRow {
  result: string;
  matchScore: number | null;
  reason: string | null;
}

interface ValidationDetailRow extends ValidationSummaryRow {
  fieldResults: Prisma.JsonValue | null;
  readAt: Date | null;
  revertedAt: Date | null;
  revertedBy: { firstName: string; lastName: string } | null;
}

export function toValidationSummary(row: ValidationSummaryRow | null) {
  return row ? { result: row.result, matchScore: row.matchScore, reason: row.reason } : null;
}

export function toValidationDetail(row: ValidationDetailRow | null, declared: Record<ValidationField, string>) {
  if (!row) return null;
  const outcomes = Array.isArray(row.fieldResults) ? (row.fieldResults as unknown as ValidationFieldOutcome[]) : [];
  return {
    ...toValidationSummary(row),
    readAt: row.readAt?.toISOString() ?? null,
    revertedAt: row.revertedAt?.toISOString() ?? null,
    revertedBy: row.revertedBy ? `${row.revertedBy.firstName} ${row.revertedBy.lastName}`.trim() : null,
    fields: outcomes.map((outcome) => ({ field: outcome.field, declared: declared[outcome.field], read: outcome.read, result: outcome.result })),
  };
}
