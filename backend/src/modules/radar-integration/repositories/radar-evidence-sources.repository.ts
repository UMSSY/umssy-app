import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

@Injectable()
export class RadarEvidenceSourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicationCvStates(userId: string, context: TransactionContext) {
    const rows = await context.client.radarCvEvidence.findMany({
      where: { userId },
      select: { cvId: true, reviewState: { select: { title: true } }, extractionState: { select: { title: true } } },
    });
    return rows.map((row) => ({ cv_id: row.cvId, review_status: row.reviewState.title, extraction_status: row.extractionState.title }));
  }

  async findCurrentCvText(
    userId: string,
  ): Promise<{ id: string; type: 'cv'; text: string }[]> {
    // Se elige primero el documento vigente para evitar reutilizar un CV anterior
    // cuando el reemplazo no se puede leer.
    const current = await this.prisma.radarCvEvidence.findFirst({
      where: { userId },
      orderBy: [{ submittedAt: 'desc' }, { cvId: 'desc' }],
      select: { cvId: true, extractedText: true, extractionState: { select: { title: true } }, reviewState: { select: { title: true } } },
    });
    if (!current || current.extractionState.title !== 'ready' || !['pending', 'approved'].includes(current.reviewState.title)) return [];
    return [{ id: current.cvId, type: 'cv', text: current.extractedText }];
  }
}
