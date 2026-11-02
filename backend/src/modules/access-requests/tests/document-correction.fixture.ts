import type { DocumentCorrectionContext, DocumentCorrectionSnapshot } from '../types/document-correction.types.js';
import type { FileMetadata } from '../../files/types/file.types.js';

export const CORRECTION_TEST_SECRET = 'document-correction-test-key-not-a-production-secret';
export const CORRECTION_TEST_CODE = 'SOL-2026-0139';

export function correctionSnapshot(overrides: Partial<DocumentCorrectionSnapshot> = {}): DocumentCorrectionSnapshot {
  return {
    id: 'request-1',
    requestCode: CORRECTION_TEST_CODE,
    firstName: 'Ana',
    lastName: 'Pérez',
    documentFileId: 'file-old',
    career: { title: 'Licenciatura en Ingeniería de Sistemas' },
    documentType: { title: 'national_title' },
    reviewedBy: null,
    status: { title: 'rejected' },
    updatedAt: new Date('2026-10-28T12:00:00.000Z'),
    ...overrides,
  };
}

export function correctionContext(overrides: Partial<DocumentCorrectionContext> = {}): DocumentCorrectionContext {
  return {
    accessRequestId: 'request-1',
    requestCode: CORRECTION_TEST_CODE,
    previousFileId: 'file-old',
    revision: new Date('2026-10-28T12:00:00.000Z'),
    ...overrides,
  };
}

export function correctedFile(): FileMetadata {
  return {
    id: 'file-new', name: 'titulo-corregido', extension: 'pdf', mimeType: 'application/pdf', size: 8,
    createdAt: new Date('2026-10-28T13:00:00.000Z'), updatedAt: new Date('2026-10-28T13:00:00.000Z'),
  };
}
