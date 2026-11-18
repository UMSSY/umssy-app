import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

@Injectable()
export class RadarEvidenceSourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUnapprovedCertificateIds(userId: string, context: TransactionContext) {
    return context.client.radarDocumentVerification.findMany({
      where: {
        userId,
        active: true,
        sourceTypeEntry: { title: 'certification' },
        statusEntry: {
          title: { notIn: ['legacy', 'approved', 'manual_approved'] },
        },
      },
      select: { sourceId: true },
    });
  }
  async findApprovedDocuments(userId: string, context: TransactionContext) {
    const rows = await context.client.radarDocumentVerification.findMany({
      where: {
        userId,
        active: true,
        statusEntry: { title: { in: ['approved', 'manual_approved'] } },
      },
      select: {
        sourceTypeEntry: { select: { title: true } },
        sourceId: true,
        skills: true,
      },
    });
    return rows.map(({ sourceTypeEntry, ...row }) => ({
      ...row,
      sourceType: sourceTypeEntry.title,
    }));
  }
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
    return this.prisma.$queryRaw<
      { id: string; type: 'certification'; text: string }[]
    >`
      SELECT d.source_id AS id,t.title AS type,string_agg(skill->>'name', '. ') AS text
      FROM radar_document_verifications d JOIN radar_document_source_types t ON t.id=d.source_type_id JOIN radar_document_statuses s ON s.id=d.status_id CROSS JOIN LATERAL jsonb_array_elements(d.skills) skill
      WHERE d.user_id=${userId}::uuid AND d.active AND t.title='certification' AND s.title IN ('approved','manual_approved')
      GROUP BY d.source_id,t.title`;
  }

  async findCurrentCvText(
    userId: string,
    cvId?: string,
  ): Promise<{ id: string; type: 'cv'; text: string }[]> {
    const current = await this.prisma.radarCvEvidence.findFirst({
      where: { userId, ...(cvId ? { cvId } : {}) },
      orderBy: [{ submittedAt: 'desc' }, { cvId: 'desc' }],
      select: {
        cvId: true,
        extractedText: true,
        extractionState: { select: { title: true } },
        reviewState: { select: { title: true } },
      },
    });
    if (!current) return [];
    const verification = await this.prisma.radarDocumentVerification.findFirst({
      where: {
        userId,
        sourceId: current.cvId,
        sourceTypeEntry: { title: 'cv' },
        active: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { statusEntry: { select: { title: true } } },
    });
    if (
      verification &&
      !['approved', 'manual_approved', 'legacy'].includes(
        verification.statusEntry.title,
      )
    )
      return [];
    if (
      current.extractionState.title !== 'ready' ||
      !['pending', 'approved'].includes(current.reviewState.title)
    )
      return [];
    return [{ id: current.cvId, type: 'cv', text: current.extractedText }];
  }
}
