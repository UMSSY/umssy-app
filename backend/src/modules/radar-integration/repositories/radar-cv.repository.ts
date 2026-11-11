import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

// El reprocesamiento conserva la decisión administrativa.
@Injectable()
export class RadarCvRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertEvidence(
    userId: string,
    cvId: string,
    extractedText: string,
    extractionStatus: string,
  ) {
    return this.prisma.$queryRaw<{ review_status: string }[]>`
      WITH saved AS (
        INSERT INTO radar_cv_evidence
          (cv_id,user_id,extracted_text,extraction_status_id,review_status_id)
        SELECT ${cvId}::uuid,${userId}::uuid,${extractedText},extraction.id,review.id
        FROM radar_cv_extraction_statuses extraction
        CROSS JOIN radar_cv_review_statuses review
        WHERE extraction.title=${extractionStatus} AND review.title='pending'
        ON CONFLICT (cv_id) DO UPDATE SET
          extracted_text=EXCLUDED.extracted_text,
          extraction_status_id=EXCLUDED.extraction_status_id,
          updated_at=clock_timestamp()
        WHERE radar_cv_evidence.user_id=EXCLUDED.user_id
        RETURNING review_status_id
      )
      SELECT review.title AS review_status FROM saved
      JOIN radar_cv_review_statuses review ON review.id=saved.review_status_id`;
  }
}
