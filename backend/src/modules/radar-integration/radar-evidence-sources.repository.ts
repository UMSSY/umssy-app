import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class RadarEvidenceSourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCurrentCvText(userId: string): Promise<{ id: string; type: 'cv'; text: string }[]> {
    // Choose the current document before checking readability/review. An unreadable
    // replacement must not silently make an older document the current NLP source.
    const rows = await this.prisma.$queryRaw<{ cv_id: string; extracted_text: string }[]>`
      SELECT cv_id,extracted_text FROM (
        SELECT cv_id,extracted_text,extraction_status,review_status
        FROM radar_cv_evidence WHERE user_id=${userId}::uuid
        ORDER BY submitted_at DESC,cv_id DESC LIMIT 1
      ) current_cv WHERE extraction_status='ready' AND review_status IN ('pending','approved')`;
    return rows.map(row => ({ id: row.cv_id, type: 'cv', text: row.extracted_text }));
  }
}
