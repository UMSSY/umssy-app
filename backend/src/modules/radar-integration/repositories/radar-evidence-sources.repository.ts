import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

@Injectable()
export class RadarEvidenceSourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicationCvStates(userId: string, context: TransactionContext) {
    const rows = await context.client.radarCvEvidence.findMany({
      where: { userId },
      select: {
        cvId: true,
        reviewState: { select: { title: true } },
        extractionState: { select: { title: true } },
      },
    });
    return rows.map((row) => ({
      cv_id: row.cvId,
      review_status: row.reviewState.title,
      extraction_status: row.extractionState.title,
    }));
  }

  findCertificateSkills(userId: string) {
    return this.prisma.$queryRaw<{id:string; type:'certification'; text:string}[]>`
      SELECT d.source_id AS id,d.source_type AS type,string_agg(skill->>'name', '. ') AS text
      FROM radar_document_verifications d CROSS JOIN LATERAL jsonb_array_elements(d.skills) skill
      WHERE d.user_id=${userId}::uuid AND d.active AND d.source_type='certification' AND d.status IN ('approved','manual_approved')
      GROUP BY d.source_id,d.source_type`;
  }

  async findCurrentCvText(
    userId: string,
  ): Promise<{ id: string; type: 'cv'; text: string }[]> {
    // Se elige primero el documento vigente para evitar reutilizar un CV anterior
    // cuando el reemplazo no se puede leer.
    const unresolved = await this.prisma.$queryRaw<{id:string}[]>`
      SELECT source_id AS id FROM radar_document_verifications WHERE user_id=${userId}::uuid
      AND source_type='cv' AND active AND status NOT IN ('approved','manual_approved','legacy')`;
    const current = await this.prisma.radarCvEvidence.findFirst({
      where: { userId, ...(unresolved.length > 0 && { cvId: { notIn: unresolved.map(row=>row.id) } }) },
      orderBy: [{ submittedAt: 'desc' }, { cvId: 'desc' }],
      select: {
        cvId: true,
        extractedText: true,
        extractionState: { select: { title: true } },
        reviewState: { select: { title: true } },
      },
    });
    if (
      !current ||
      current.extractionState.title !== 'ready' ||
      !['pending', 'approved'].includes(current.reviewState.title)
    )
      return [];
    return [{ id: current.cvId, type: 'cv', text: current.extractedText }];
  }
}
