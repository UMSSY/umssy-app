import { describe, expect, it, vi } from 'vitest';
import { CertificationDocumentsService } from '../services/certification-documents.service.js';
import { CertificationDocumentsRepository } from '../repositories/certification-documents.repository.js';
import { CertificationDocumentVersionConflictException } from '../exceptions/certification-document-version-conflict.exception.js';
import { RadarAuditRepository } from '../../radar-integration/repositories/radar-audit.repository.js';
import { RadarAuditService } from '../../radar-integration/services/radar-audit.service.js';
import { CertificationMapper } from '../../certifications/mappers/certification.mapper.js';
import { CertificationDocumentMapper } from '../mappers/certification-document.mapper.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

function setup() {
  const record = {
    id: 'certificate',
    userId: 'owner',
    name: 'Docker',
    issuingOrganization: 'UMSS',
    issueDate: new Date('2026-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const transaction = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: record.id }]),
    $executeRaw: vi.fn().mockResolvedValue(1),
    radarDocumentVerification: {
      findFirst: vi.fn().mockResolvedValue({ id: 'version' }),
    },
    certification: { update: vi.fn().mockResolvedValue({ id: record.id }) },
  };
  const context = { client: transaction } as unknown as TransactionContext;
  const prisma = {
    certification: { findFirst: vi.fn().mockResolvedValue({ id: record.id }) },
  } as unknown as PrismaService;
  const documents = new CertificationDocumentsRepository(prisma);
  const radar = new RadarAuditService(new RadarAuditRepository(prisma));
  const findVersion = vi.spyOn(radar, 'findActiveCertificationVerification');
  const refresh = vi.fn();
  const service = new CertificationDocumentsService(
    ...([
      { findById: vi.fn().mockResolvedValue(record) },
      documents,
      {
        validate: vi
          .fn()
          .mockReturnValue({
            buffer: Buffer.from('pdf'),
            detectedMimeType: 'application/pdf',
          }),
      },
      new CertificationMapper(),
      new CertificationDocumentMapper(),
      { refreshAfterChange: refresh },
      radar,
      {
        run: (operation: (value: TransactionContext) => Promise<unknown>) =>
          operation(context),
      },
    ] as unknown as ConstructorParameters<
      typeof CertificationDocumentsService
    >),
  );
  return { service, transaction, context, findVersion, refresh };
}

describe('Certification document version concurrency', () => {
  it('waits for the certification lock before reading Radar and writing through the same transaction', async () => {
    const { service, transaction, context, findVersion } = setup();
    let release: (rows: { id: string }[]) => void = () => {};
    transaction.$queryRaw.mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const upload = service.upload('owner', 'certificate', undefined, 'version');
    await vi.waitFor(() =>
      expect(transaction.$queryRaw).toHaveBeenCalledOnce(),
    );
    expect(findVersion).not.toHaveBeenCalled();
    expect(transaction.certification.update).not.toHaveBeenCalled();
    release([{ id: 'certificate' }]);
    await upload;
    expect(findVersion).toHaveBeenCalledWith('owner', 'certificate', context);
    expect(
      transaction.radarDocumentVerification.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        userId: 'owner',
        sourceId: 'certificate',
        sourceTypeEntry: { title: 'certification' },
        active: true,
      },
      select: { id: true },
    });
    expect(transaction.certification.update).toHaveBeenCalledOnce();
    expect(transaction.$executeRaw).toHaveBeenCalledOnce();
    expect(transaction.$queryRaw.mock.calls[0][0].join(' ')).toContain(
      'FOR UPDATE',
    );
    expect(transaction.$queryRaw.mock.calls[0].slice(1)).toEqual([
      'certificate',
      'owner',
    ]);
  });

  it.each(['upload', 'remove'] as const)(
    'rejects a stale %s before writing or refreshing analysis',
    async (operation) => {
      const { service, transaction, refresh } = setup();
      transaction.radarDocumentVerification.findFirst.mockResolvedValue({
        id: 'new-version',
      });
      const mutation =
        operation === 'upload'
          ? service.upload('owner', 'certificate', undefined, 'old-version')
          : service.remove('owner', 'certificate', 'old-version');
      await expect(mutation).rejects.toBeInstanceOf(
        CertificationDocumentVersionConflictException,
      );
      expect(transaction.certification.update).not.toHaveBeenCalled();
      expect(transaction.$executeRaw).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  it('rejects a removed active version with a structured domain conflict', async () => {
    const { service, transaction } = setup();
    transaction.radarDocumentVerification.findFirst.mockResolvedValue(null);
    await expect(
      service.remove('owner', 'certificate', 'version'),
    ).rejects.toMatchObject({
      code: 'CERTIFICATION_DOCUMENT_VERSION_CONFLICT',
      statusCode: 409,
    });
    expect(transaction.certification.update).not.toHaveBeenCalled();
  });
});
