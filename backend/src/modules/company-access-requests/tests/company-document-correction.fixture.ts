import type {
  CompanyDocumentCorrectionContext,
  CompanyDocumentCorrectionSnapshot,
} from '../types/company-document-correction.types.js';

export const CORRECTION_SECRET = 'test-secret-for-company-correction';

export function companyCorrectionSnapshot(
  overrides: Partial<CompanyDocumentCorrectionSnapshot> = {},
): CompanyDocumentCorrectionSnapshot {
  return {
    id: 'request-1',
    requestCode: 'EMP-2026-0001',
    documentFileId: 'file-1',
    reviewedAt: new Date('2026-11-20T15:00:00.000Z'),
    status: { title: 'OBSERVED' },
    ...overrides,
  };
}

export function companyCorrectionContext(
  overrides: Partial<CompanyDocumentCorrectionContext> = {},
): CompanyDocumentCorrectionContext {
  return {
    requestId: 'request-1',
    requestCode: 'EMP-2026-0001',
    previousFileId: 'file-1',
    revision: new Date('2026-11-20T15:00:00.000Z'),
    ...overrides,
  };
}
