import { describe, expect, it, vi } from 'vitest';
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { CertificationRecordsService } from '../services/certification-records.service.js';
import type { CertificationsRepository } from '../repositories/certifications.repository.js';
import type { RadarAuditService } from '../../radar-integration/services/radar-audit.service.js';

const fields = {
  name: 'Certificado',
  issuingOrganization: 'Universidad',
  issueDate: new Date('2025-01-01'),
};
const metadata = {
  documentFileName: 'certificado.pdf',
  documentMimeType: 'application/pdf',
  documentSizeBytes: 3,
  documentUploadedAt: new Date('2025-01-02'),
};
const document = { documentUrl: new Uint8Array([1, 2, 3]), ...metadata };
const record = { id: 'certificate', userId: 'owner', ...fields };

function setup() {
  const transactionClient = {} as TransactionContext['client'];
  const commit = vi.fn();
  const rollback = vi.fn();
  const prisma = {
    $transaction: vi.fn(
      async (
        operation: (client: TransactionContext['client']) => Promise<unknown>,
      ) => {
        try {
          const result = await operation(transactionClient);
          commit();
          return result;
        } catch (error) {
          rollback();
          throw error;
        }
      },
    ),
  };
  const repository = {
    create: vi.fn().mockResolvedValue(record),
    update: vi.fn().mockResolvedValue(record),
    findManyByUserId: vi.fn().mockResolvedValue([record]),
    findById: vi.fn().mockResolvedValue(record),
  };
  const audit = {
    saveDocumentMetadata: vi.fn(),
    findDocumentMetadata: vi
      .fn()
      .mockResolvedValue(new Map([[record.id, metadata]])),
  };
  const service = new CertificationRecordsService(
    repository as unknown as CertificationsRepository,
    audit as unknown as RadarAuditService,
    new TransactionService(prisma as unknown as PrismaService),
  );
  return { service, repository, audit, transactionClient, commit, rollback };
}

describe('Coordinación transaccional de certificaciones', () => {
  it.each(['create', 'update'] as const)(
    'comparte el contexto entre %s y la auditoría',
    async (operation) => {
      const { service, repository, audit, transactionClient, commit } = setup();
      const result =
        operation === 'create'
          ? await service.create(record.userId, fields, document)
          : await service.update(record.id, fields, document);
      expect(repository[operation].mock.calls[0].at(-1)).toEqual({
        client: transactionClient,
      });
      expect(audit.saveDocumentMetadata).toHaveBeenCalledWith(
        record.userId,
        record.id,
        metadata,
        { client: transactionClient },
      );
      expect(result).toMatchObject(metadata);
      expect(commit).toHaveBeenCalledOnce();
    },
  );

  it.each(['create', 'update'] as const)(
    'propaga el fallo de auditoría y revierte %s',
    async (operation) => {
      const { service, audit, commit, rollback } = setup();
      audit.saveDocumentMetadata.mockRejectedValue(
        new Error('audit unavailable'),
      );
      const pending =
        operation === 'create'
          ? service.create(record.userId, fields, document)
          : service.update(record.id, fields, document);
      await expect(pending).rejects.toThrow('audit unavailable');
      expect(rollback).toHaveBeenCalledOnce();
      expect(commit).not.toHaveBeenCalled();
    },
  );

  it('combina los metadatos históricos a través del servicio propietario', async () => {
    const { service, audit } = setup();
    expect(await service.findManyByUserId(record.userId)).toEqual([
      { ...record, ...metadata },
    ]);
    expect(await service.findById(record.id)).toEqual({
      ...record,
      ...metadata,
    });
    expect(audit.findDocumentMetadata).toHaveBeenCalledWith(record.userId, [
      record.id,
    ]);
  });
});
