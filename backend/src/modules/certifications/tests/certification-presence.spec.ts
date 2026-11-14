import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionService } from '../../../common/prisma/transaction.service.js';
import type { RadarAuditService } from '../../radar-integration/services/radar-audit.service.js';
import { CertificationsRepository } from '../repositories/certifications.repository.js';
import { CertificationRecordsService } from '../services/certification-records.service.js';
import { CertificationSourcesService } from '../services/certification-sources.service.js';

describe('Certification presence', () => {
  it.each([null, { id: 'certification-1' }])(
    'checks saved certifications without querying document metadata or bytes: %j',
    async (record) => {
      const findFirst = vi.fn().mockResolvedValue(record);
      const findDocumentMetadata = vi.fn();
      const repository = new CertificationsRepository({
        certification: { findFirst },
      } as unknown as PrismaService);
      const records = new CertificationRecordsService(
        repository,
        { findDocumentMetadata } as unknown as RadarAuditService,
        {} as TransactionService,
      );
      const service = new CertificationSourcesService(records);

      await expect(service.hasByUserId('owner-1')).resolves.toBe(
        record !== null,
      );
      expect(findFirst).toHaveBeenCalledExactlyOnceWith({
        where: { userId: 'owner-1' },
        select: { id: true },
      });
      expect(findDocumentMetadata).not.toHaveBeenCalled();
    },
  );
});
