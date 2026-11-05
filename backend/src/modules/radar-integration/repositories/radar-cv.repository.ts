import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

/** Owns storage of Radar CV evidence; approval is deliberately not changed by rescans. */
@Injectable()
export class RadarCvRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertEvidence(userId: string, cvId: string, extractedText: string, extractionStatus: string) {
    return this.prisma.$queryRaw<{ review_status: string }[]>`
      INSERT INTO radar_cv_evidence
        (cv_id,user_id,extracted_text,extraction_status,review_status,extraction_status_id,review_status_id)
      SELECT ${cvId}::uuid,${userId}::uuid,${extractedText},${extractionStatus},'pending',extraction.id,review.id
      FROM radar_cv_extraction_statuses extraction
      CROSS JOIN radar_cv_review_statuses review
      WHERE extraction.title=${extractionStatus} AND review.title='pending'
      ON CONFLICT (cv_id) DO UPDATE SET
        extracted_text=EXCLUDED.extracted_text,
        extraction_status=EXCLUDED.extraction_status,
        extraction_status_id=EXCLUDED.extraction_status_id,
        review_status_id=COALESCE(
          radar_cv_evidence.review_status_id,
          (SELECT id FROM radar_cv_review_statuses WHERE title=radar_cv_evidence.review_status)
        )
      WHERE radar_cv_evidence.user_id=EXCLUDED.user_id
      RETURNING review_status`;
  }

  currentCv(userId: string) {
    return this.prisma.userCvFile.findFirst({
      where: { userId },
      orderBy: { cvUploadedAt: 'desc' },
      select: { id: true, cvPdfData: true },
    });
  }

  cvById(cvId: string) {
    return this.prisma.userCvFile.findUnique({
      where: { id: cvId },
      select: { id: true, userId: true, cvPdfData: true },
    });
  }
}
