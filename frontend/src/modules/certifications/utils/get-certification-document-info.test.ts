import { describe, expect, it } from 'vitest';
import type { Certification } from '../types/certification.types';
import { getCertificationDocumentInfo } from './get-certification-document-info';

const certification: Certification = { id: 'certificate', name: 'Python', issuingOrganization: 'QA', issueDate: '2024-01-01', createdAt: '', updatedAt: '' };

describe('Persisted certification attachment metadata', () => {
  it('reads the original file name and upload date without browser cache', () => {
    const result = getCertificationDocumentInfo({ ...certification, document: { fileName: 'original-proof.pdf', mimeType: 'application/pdf', sizeBytes: 123, uploadedAt: '2026-10-27T12:00:00Z' } });
    expect(result).toMatchObject({ fileName: 'original-proof.pdf', format: 'PDF' });
    expect(result?.uploadedAt).not.toBe('');
  });
  it('allows the existing fallback for historical files without metadata', () => {
    expect(getCertificationDocumentInfo(certification)).toBeUndefined();
  });
});
