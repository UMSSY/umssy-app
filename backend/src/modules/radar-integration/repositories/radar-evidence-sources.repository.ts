import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

@Injectable()
export class RadarEvidenceSourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublicationCvStates(userId: string, context: TransactionContext) {
    return context.client.$queryRaw<
      { cv_id: string; review_status: string; extraction_status: string }[]
    >`
      SELECT e.cv_id, review.title AS review_status, extraction.title AS extraction_status
      FROM radar_cv_evidence e
      JOIN radar_cv_review_statuses review ON review.id=e.review_status_id
      JOIN radar_cv_extraction_statuses extraction ON extraction.id=e.extraction_status_id
      WHERE e.user_id=${userId}::uuid`;
  }

  async findCurrentCvText(
    userId: string,
  ): Promise<{ id: string; type: 'cv'; text: string }[]> {
    // Se elige primero el documento vigente para evitar reutilizar un CV anterior
    // cuando el reemplazo no se puede leer.
    const rows = await this.prisma.$queryRaw<
      { cv_id: string; extracted_text: string }[]
    >`
      SELECT cv_id,extracted_text FROM (
        SELECT e.cv_id,e.extracted_text,extraction.title AS extraction_status,review.title AS review_status
        FROM radar_cv_evidence e
        JOIN radar_cv_review_statuses review ON review.id=e.review_status_id
        JOIN radar_cv_extraction_statuses extraction ON extraction.id=e.extraction_status_id
        WHERE e.user_id=${userId}::uuid
        ORDER BY submitted_at DESC,cv_id DESC LIMIT 1
      ) current_cv WHERE extraction_status='ready' AND review_status IN ('pending','approved')`;
    return rows.map((row) => ({
      id: row.cv_id,
      type: 'cv',
      text: row.extracted_text,
    }));
  }
}
