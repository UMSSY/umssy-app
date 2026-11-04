import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

/** Owns storage of Radar CV evidence; approval is deliberately not changed by rescans. */
@Injectable()
export class RadarCvRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertEvidence(userId: string, cvId: string, extractedText: string, extractionStatus: string) {
    return this.prisma.$queryRaw<{ review_status: string }[]>`
      INSERT INTO radar_cv_evidence (cv_id,user_id,extracted_text,extraction_status,review_status)
      VALUES (${cvId}::uuid,${userId}::uuid,${extractedText},${extractionStatus},'pending')
      ON CONFLICT (cv_id) DO UPDATE SET
        extracted_text=EXCLUDED.extracted_text,
        extraction_status=EXCLUDED.extraction_status
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
