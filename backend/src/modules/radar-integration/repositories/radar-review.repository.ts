import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

import type { CvReview } from '../types/cv-review.types.js';

import type { ReviewOperationRecord } from '../types/review-operation-record.types.js';
@Injectable()
export class RadarReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  listReviewQueue() {
    return this.prisma.$queryRaw<(CvReview & { name: string })[]>`
        SELECT e.cv_id,e.user_id,extraction.title AS extraction_status,review.title AS review_status,e.submitted_at,
          CHAR_LENGTH(e.extracted_text) AS extracted_chars,c.cv_file_name,
          (u.first_name||' '||u.last_name) AS name
        FROM radar_cv_evidence e
        JOIN radar_cv_extraction_statuses extraction ON extraction.id=e.extraction_status_id
        JOIN radar_cv_review_statuses review ON review.id=e.review_status_id
        JOIN users u ON u.id=e.user_id
        JOIN user_cv_file c ON c.id=e.cv_id
        WHERE NOT EXISTS (SELECT 1 FROM radar_document_verifications d WHERE d.source_type_id=(SELECT id FROM radar_document_source_types WHERE title='cv') AND d.source_id=e.cv_id AND d.status_id<>(SELECT id FROM radar_document_statuses WHERE title='legacy'))
        ORDER BY e.submitted_at DESC LIMIT 300`;
  }

  async lockReviewOperation(
    operationId: string,
    context: TransactionContext,
  ): Promise<void> {
    await context.client.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${operationId}, 0))
    `;
  }

  findReviewOperation(operationId: string, context: TransactionContext) {
    return context.client.$queryRaw<ReviewOperationRecord[]>`
      SELECT
        id,
        actor_id AS admin_id,
        details->>'flow' AS flow,
        details->>'kind' AS kind,
        target_id,
        details->>'payloadHash' AS payload_hash,
        details->'responseData' AS response_data,
        occurred_at AS created_at
      FROM radar_audit_events
      WHERE event_type = 'radar.review.operation'
        AND details->>'operationId' = ${operationId}
      ORDER BY occurred_at DESC
      LIMIT 1
    `;
  }

  saveReviewOperationResult(
    userId: string,
    adminId: string,
    operationId: string,
    flow: string,
    kind: string,
    targetId: string,
    payloadHash: string,
    responseData: object,
    context: TransactionContext,
  ) {
    const details = {
      operationId,
      flow,
      kind,
      payloadHash,
      responseData,
    };

    return context.client.$executeRaw`
      INSERT INTO radar_audit_events (
        user_id,
        actor_id,
        event_type,
        target_id,
        details
      )
      VALUES (
        ${userId}::uuid,
        ${adminId}::uuid,
        'radar.review.operation',
        ${targetId}::uuid,
        ${JSON.stringify(details)}::jsonb
      )
    `;
  }

  changeCvDecision(
    adminId: string,
    cvId: string,
    action: string,
    context: TransactionContext,
  ) {
    return context.client.$queryRaw<
      { user_id: string; review_status: string }[]
    >`
      UPDATE radar_cv_evidence evidence
      SET review_status_id=status.id,reviewer_id=${adminId}::uuid,decided_at=now(),updated_at=clock_timestamp()
      FROM radar_cv_review_statuses status
      WHERE evidence.cv_id=${cvId}::uuid AND evidence.review_status_id<>status.id AND status.title=${action}
        AND NOT EXISTS (SELECT 1 FROM radar_document_verifications d WHERE d.source_type_id=(SELECT id FROM radar_document_source_types WHERE title='cv') AND d.source_id=evidence.cv_id AND d.active AND d.status_id<>(SELECT id FROM radar_document_statuses WHERE title='legacy'))
      RETURNING evidence.user_id,status.title AS review_status`;
  }

  async cvOwner(cvId: string, context: TransactionContext) {
    const row = await context.client.radarCvEvidence.findUnique({
      where: { cvId },
      select: { userId: true },
    });
    return row ? [{ user_id: row.userId }] : [];
  }
}
