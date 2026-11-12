import { Injectable } from '@nestjs/common';
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import { CertificationsRepository } from '../repositories/certifications.repository.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { RadarAuditService } from '../../radar-integration/services/radar-audit.service.js';
import type { CreateCertificationRequest } from '../requests/create-certification.request.js';
import type { UpdateCertificationRequest } from '../requests/update-certification.request.js';
import type { CertificationRecord } from '../types/certification-record.type.js';
import type { CertificationDocumentData } from '../../certification-documents/types/certification-document-data.type.js';
import type { CertificationDocumentMetadata } from '../../certification-documents/types/certification-document-metadata.type.js';

function metadataOf(
  document: CertificationDocumentData,
): CertificationDocumentMetadata | null {
  if (document.documentUrl === null) return null;
  return {
    documentFileName: document.documentFileName,
    documentMimeType: document.documentMimeType,
    documentSizeBytes: document.documentSizeBytes,
    documentUploadedAt: document.documentUploadedAt,
  };
}

@Injectable()
export class CertificationRecordsService {
  constructor(
    private readonly repository: CertificationsRepository,
    private readonly audit: RadarAuditService,
    private readonly transactions: TransactionService,
  ) {}

  hasByUserId(userId: string): Promise<boolean> {
    return this.repository.hasByUserId(userId);
  }

  findPublicationEvidenceIds(userId: string, context: TransactionContext) {
    return this.repository.findPublicationEvidenceIds(userId, context);
  }

  async findManyByUserId(userId: string): Promise<CertificationRecord[]> {
    const rows = await this.repository.findManyByUserId(userId);
    const metadata = await this.audit.findDocumentMetadata(
      userId,
      rows.map((row) => row.id),
    );
    return rows.map((row) => ({ ...row, ...metadata.get(row.id) }));
  }

  async findById(id: string): Promise<CertificationRecord | null> {
    const row = await this.repository.findById(id);
    if (!row) return null;
    const metadata = await this.audit.findDocumentMetadata(row.userId, [id]);
    return { ...row, ...metadata.get(id) };
  }

  create(
    userId: string,
    data: CreateCertificationRequest,
    document?: CertificationDocumentData,
  ): Promise<CertificationRecord> {
    if (!document) return this.repository.create(userId, data);
    return this.transactions.run(async (context) => {
      const row = await this.repository.create(userId, data, document, context);
      const metadata = metadataOf(document);
      await this.audit.saveDocumentMetadata(userId, row.id, metadata, context);
      return { ...row, ...metadata };
    });
  }

  async update(
    id: string,
    data: UpdateCertificationRequest,
    document?: CertificationDocumentData,
  ): Promise<CertificationRecord> {
    if (document) {
      return this.transactions.run(async (context) => {
        const row = await this.repository.update(id, data, document, context);
        const metadata = metadataOf(document);
        await this.audit.saveDocumentMetadata(
          row.userId,
          id,
          metadata,
          context,
        );
        return { ...row, ...metadata };
      });
    }
    const row = await this.repository.update(id, data);
    const metadata = await this.audit.findDocumentMetadata(row.userId, [id]);
    return { ...row, ...metadata.get(id) };
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
