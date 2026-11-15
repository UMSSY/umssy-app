import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

import type { CvReview } from '../types/cv-review.type.js';

type ReviewOperationRecord = {
  id: string;
  admin_id: string;
  kind: string;
  target_id: string;
  decision: string;
  payload_hash: string;
  response_data: unknown;
  created_at: Date;
};

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
        WHERE NOT EXISTS (SELECT 1 FROM radar_document_verifications d WHERE d.source_type='cv' AND d.source_id=e.cv_id AND d.status<>'legacy')
        ORDER BY e.submitted_at DESC LIMIT 300`;
  }

  claimReviewOperation(
    operationId: string,
    adminId: string,
    kind: string,
    targetId: string,
    decision: string,
    payloadHash: string,
    context: TransactionContext,
  ) {
    return context.client.$executeRaw`
      INSERT INTO radar_review_operations (
        id,
        admin_id,
        kind,
        target_id,
        decision,
        payload_hash,
        response_data
      )
      VALUES (
        ${operationId}::uuid,
        ${adminId}::uuid,
        ${kind},
        ${targetId}::uuid,
        ${decision},
        ${payloadHash},
        '{}'::jsonb
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  findReviewOperation(
    operationId: string,
    context: TransactionContext,
  ) {
    return context.client.$queryRaw<ReviewOperationRecord[]>`
      SELECT
        id,
        admin_id,
        kind,
        target_id,
        decision,
        payload_hash,
        response_data,
        created_at
      FROM radar_review_operations
      WHERE id = ${operationId}::uuid
      LIMIT 1
    `;
  }

  saveReviewOperationResult(
    operationId: string,
    responseData: object,
    context: TransactionContext,
  ) {
    return context.client.$executeRaw`
      UPDATE radar_review_operations
      SET response_data = ${JSON.stringify(responseData)}::jsonb
      WHERE id = ${operationId}::uuid
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
        AND NOT EXISTS (SELECT 1 FROM radar_document_verifications d WHERE d.source_type='cv' AND d.source_id=evidence.cv_id AND d.active AND d.status<>'legacy')
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
