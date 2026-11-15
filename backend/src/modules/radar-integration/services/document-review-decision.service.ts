import { createHash } from 'node:crypto';
import { ConflictException, Injectable } from '@nestjs/common';
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import { RadarReviewOperationConflictException } from '../exceptions/radar-review-operation-conflict.exception.js';
import { RadarReviewNotFoundException } from '../exceptions/radar-review-not-found.exception.js';
import { DocumentVerificationRepository } from '../repositories/document-verification.repository.js';
import { RadarReviewRepository } from '../repositories/radar-review.repository.js';
import { RadarAccessRepository } from '../repositories/radar-access.repository.js';

type DocumentDecision = 'approved' | 'rejected';

@Injectable()
export class DocumentReviewDecisionService {
  constructor(
    private readonly documents: DocumentVerificationRepository,
    private readonly reviews: RadarReviewRepository,
    private readonly access: RadarAccessRepository,
    private readonly transactions: TransactionService,
  ) {}

  async operationStatus(adminId: string, operationId: string) {
    return this.transactions.run(async (context) => {
      await this.reviews.lockReviewOperation(operationId, context);

      const existing = await this.reviews.findReviewOperation(
        operationId,
        context,
      );

      if (!existing.length) {
        throw new RadarReviewNotFoundException('Operacion no encontrada');
      }

      const saved = existing[0];

      if (
        saved.admin_id !== adminId ||
        saved.flow !== 'document-review' ||
        saved.kind !== 'cv'
      ) {
        throw new RadarReviewNotFoundException('Operacion no encontrada');
      }

      return saved.response_data;
    });
  }

  async decide(
    adminId: string,
    documentId: string,
    operationId: string,
    decision: DocumentDecision,
  ) {
    const payloadHash = createHash('sha256')
      .update(
        JSON.stringify({
          kind: 'cv',
          targetId: documentId,
          decision,
        }),
      )
      .digest('hex');

    return this.transactions.run(async (context) => {
      await this.reviews.lockReviewOperation(operationId, context);
      const existing = await this.reviews.findReviewOperation(operationId, context);

      if (existing.length) {
        const saved = existing[0];

        if (saved.admin_id !== adminId)
          throw new RadarReviewNotFoundException('Operacion no encontrada');

        if (
          saved.flow !== 'document-review' ||
          saved.kind !== 'cv' ||
          saved.target_id !== documentId ||
          saved.payload_hash !== payloadHash
        )
          throw new RadarReviewOperationConflictException();

        return saved.response_data;
      }

      const changed = await this.documents.decide(
        adminId,
        documentId,
        decision === 'approved',
        context,
      );

      if (!changed.length) {
        throw new ConflictException(
          'La version ya tiene una decision o fue reemplazada.',
        );
      }

      const userId = changed[0].userId;

      await this.access.recordAudit(
        userId,
        adminId,
        `cv.${decision}`,
        documentId,
        { operationId },
        context,
      );

      const result = {
        operationId,
        status: 'completed' as const,
        kind: 'cv' as const,
        targetId: documentId,
        decision,
        changed: true,
        userId,
        completedAt: new Date().toISOString(),
      };

      await this.reviews.saveReviewOperationResult(
        userId,
        adminId,
        operationId,
        'document-review',
        'cv',
        documentId,
        payloadHash,
        result,
        context,
      );

      return result;
    });
  }
}
