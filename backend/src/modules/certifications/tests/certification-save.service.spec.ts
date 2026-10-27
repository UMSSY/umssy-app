import { describe, expect, it, vi } from 'vitest';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import type { CertificationDocumentsService } from '../../certification-documents/services/certification-documents.service.js';
import type { CertificationDocumentsRepository } from '../../certification-documents/repositories/certification-documents.repository.js';
import type { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import { CertificationMapper } from '../mappers/certification.mapper.js';
import type { CertificationsRepository } from '../repositories/certifications.repository.js';
import { CertificationsService } from '../services/certifications.service.js';

const userId = 'owner';
const id = 'certificate';
const data = { name: 'Python', issuingOrganization: 'QA', issueDate: new Date('2024-01-01') };
const record = { id, userId, ...data, createdAt: new Date(), updatedAt: new Date() };
const file = { originalname: 'proof.pdf', mimetype: 'application/pdf', size: 3, buffer: Buffer.from('pdf') };
const metadata = { documentFileName: 'proof.pdf', documentMimeType: 'application/pdf', documentSizeBytes: 3, documentUploadedAt: new Date('2026-10-27T00:00:00Z') };

function setup() {
  const repository = { findById: vi.fn().mockResolvedValue(record), create: vi.fn().mockResolvedValue({ ...record, ...metadata }), update: vi.fn().mockResolvedValue({ ...record, ...metadata }) };
  const documentsRepository = { hasDocument: vi.fn().mockResolvedValue(true) };
  const analysis = { refreshAfterChange: vi.fn().mockResolvedValue(undefined) };
  const documents = { prepare: vi.fn().mockReturnValue({ content: file.buffer, metadata }) };
  const service = new CertificationsService(repository as unknown as CertificationsRepository, documentsRepository as unknown as CertificationDocumentsRepository, new CertificationMapper(), analysis as unknown as ProfileSkillsAnalysisService, documents as unknown as CertificationDocumentsService);
  return { service, repository, documents, analysis };
}

describe('Atomic certification and attachment save', () => {
  it('creates fields, bytes and metadata together and refreshes NLP after persistence', async () => {
    const { service, repository, analysis } = setup();
    const result = await service.saveWithDocument(userId, null, data, 'replace', file);
    expect(repository.create).toHaveBeenCalledWith(userId, data, { documentUrl: new Uint8Array(file.buffer), ...metadata });
    expect(result.document).toEqual({ fileName: 'proof.pdf', mimeType: 'application/pdf', sizeBytes: 3, uploadedAt: metadata.documentUploadedAt.toISOString() });
    expect(analysis.refreshAfterChange).toHaveBeenCalledWith(userId);
  });

  it('does not create or edit anything when file validation fails', async () => {
    const { service, repository, documents, analysis } = setup();
    documents.prepare.mockImplementation(() => { throw new Error('invalid attachment'); });
    await expect(service.saveWithDocument(userId, null, data, 'replace', file)).rejects.toThrow('invalid attachment');
    await expect(service.saveWithDocument(userId, id, data, 'replace', file)).rejects.toThrow('invalid attachment');
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
    expect(analysis.refreshAfterChange).not.toHaveBeenCalled();
  });

  it('removes attachment metadata in the same update as the edited fields', async () => {
    const { service, repository } = setup();
    const result = await service.saveWithDocument(userId, id, data, 'remove', undefined);
    expect(repository.update).toHaveBeenCalledWith(id, data, { documentUrl: null, documentFileName: null, documentMimeType: null, documentSizeBytes: null, documentUploadedAt: null });
    expect(result.hasDocument).toBe(false);
    expect(result.document).toBeUndefined();
  });

  it('keeps the existing file when only the metadata fields are edited', async () => {
    const { service, documents, repository } = setup();
    const result = await service.saveWithDocument(userId, id, data, 'keep', undefined);
    expect(documents.prepare).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(id, data, undefined);
    expect(result.hasDocument).toBe(true);
  });

  it.each(['keep', 'remove'] as const)('requires a backing file when creating with action %s', async action => {
    const { service, repository } = setup();
    await expect(service.saveWithDocument(userId, null, data, action, undefined)).rejects.toThrow('Adjunta el respaldo');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a file that contradicts the requested keep action', async () => {
    const { service, repository } = setup();
    await expect(service.saveWithDocument(userId, id, data, 'keep', file as MulterFile)).rejects.toThrow('La acción no corresponde');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('checks ownership before inspecting the uploaded file', async () => {
    const { service, repository, documents } = setup();
    repository.findById.mockResolvedValueOnce({ ...record, userId: 'another-person' });
    await expect(service.saveWithDocument(userId, id, data, 'replace', file)).rejects.toThrow();
    expect(documents.prepare).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
