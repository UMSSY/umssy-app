import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import type { CertificationDocumentMetadata } from '../../certification-documents/types/certification-document-metadata.type.js';
import { RadarAuditRepository } from '../repositories/radar-audit.repository.js';

@Injectable()
export class RadarAuditService {
  constructor(private readonly repository: RadarAuditRepository) {}

  findActiveCertificationVerification(
    userId: string,
    id: string,
    context: TransactionContext,
  ) {
    return this.repository.findActiveCertificationVerification(
      userId,
      id,
      context.client,
    );
  }

  saveDocumentMetadata(
    userId: string,
    id: string,
    metadata: CertificationDocumentMetadata | null,
    context: TransactionContext,
  ) {
    return this.repository.saveDocumentMetadata(
      userId,
      id,
      metadata,
      context.client,
    );
  }

  findDocumentMetadata(
    userId: string,
    ids: string[],
    context?: TransactionContext,
  ) {
    return this.repository.findDocumentMetadata(userId, ids, context?.client);
  }
}
