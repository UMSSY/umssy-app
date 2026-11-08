import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

import type { CvReview } from '../types/cv-review.type.js';

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
        ORDER BY e.submitted_at DESC LIMIT 300`;
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
