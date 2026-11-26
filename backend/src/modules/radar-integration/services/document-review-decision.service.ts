import { findReviewOperation } from '../utils/find-review-operation.js';
import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import { RadarReviewNotFoundException } from '../exceptions/radar-review-not-found.exception.js';
import { DocumentVerificationRepository } from '../repositories/document-verification.repository.js';
import { RadarReviewRepository } from '../repositories/radar-review.repository.js';
import { RadarAccessRepository } from '../repositories/radar-access.repository.js';

import type { DocumentReviewDecision } from '../types/document-review-decision.types.js';
import type { DocumentDecisionRequest } from '../types/document-decision-request.types.js';
import { DocumentReviewService } from './document-review.service.js';
import { DocumentVerificationConflictException } from '../exceptions/document-verification-conflict.exception.js';

@Injectable()
export class DocumentReviewDecisionService {
  constructor(
    private readonly documents: DocumentVerificationRepository,
    private readonly reviews: RadarReviewRepository,
    private readonly access: RadarAccessRepository,
    private readonly transactions: TransactionService,
    private readonly documentReview: DocumentReviewService,
  ) {}

  resolve(admin: string, id: string, body: DocumentDecisionRequest) {
    if (!('operationId' in body))
      return this.documentReview.revise(admin, id, body.decision);
    return this.decide(admin, id, body.operationId, body.decision);
  }

  async operationStatus(adminId: string, operationId: string) {
    return this.transactions.run(async (context) => {
      const saved = await findReviewOperation(this.reviews, context, {
        adminId,
        operationId,
        flow: 'document-review',
        kind: 'cv',
      });
      if (!saved)
        throw new RadarReviewNotFoundException('Operacion no encontrada');

      return saved.response_data;
    });
  }

  async decide(
    adminId: string,
    documentId: string,
    operationId: string,
    decision: DocumentReviewDecision,
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
      const saved = await findReviewOperation(this.reviews, context, {
        adminId,
        operationId,
        flow: 'document-review',
        kind: 'cv',
        targetId: documentId,
        payloadHash,
      });
      if (saved) return saved.response_data;

      const changed = await this.documents.decide(
        adminId,
        documentId,
        decision === 'approved',
        context,
      );

      if (!changed.length) {
        throw new DocumentVerificationConflictException();
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
