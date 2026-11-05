import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { Prisma } from '../../prisma/client.js';
import type { CertificationDocumentMetadata } from '../certification-documents/types/certification-document-metadata.type.js';

type AuditClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class RadarAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveDocumentMetadata(userId: string, id: string, metadata: CertificationDocumentMetadata | null, client: AuditClient): Promise<void> {
    const details = metadata ? { ...metadata, documentUploadedAt: metadata.documentUploadedAt.toISOString() } : { removed: true };
    // Existing JSON audit payload; no new table or column is required.
    await client.$executeRaw`INSERT INTO radar_audit_events (user_id,actor_id,event_type,target_id,details,occurred_at)
      VALUES (${userId}::uuid,${userId}::uuid,'certification.document_metadata',${id}::uuid,${JSON.stringify(details)}::jsonb,clock_timestamp())`;
  }

  async findDocumentMetadata(userId: string, ids: string[], client: AuditClient = this.prisma): Promise<Map<string, CertificationDocumentMetadata>> {
    if (!ids.length) return new Map();
    const rows = await client.$queryRaw<{ target_id: string; details: Partial<Omit<CertificationDocumentMetadata, 'documentUploadedAt'>> & { documentUploadedAt?: string; removed?: boolean } }[]>`
      SELECT DISTINCT ON (target_id) target_id,details FROM radar_audit_events
      WHERE user_id=${userId}::uuid AND event_type='certification.document_metadata'
      AND target_id IN (${Prisma.join(ids.map(id => Prisma.sql`${id}::uuid`))})
      ORDER BY target_id,occurred_at DESC,id DESC`;
    const result = new Map<string, CertificationDocumentMetadata>();
    for (const row of rows) {
      const value = row.details;
      if (value.removed || !value.documentFileName || !value.documentMimeType || value.documentSizeBytes == null || !value.documentUploadedAt) continue;
      const uploadedAt = new Date(value.documentUploadedAt);
      if (!Number.isFinite(uploadedAt.getTime())) continue;
      result.set(row.target_id, { documentFileName: value.documentFileName, documentMimeType: value.documentMimeType, documentSizeBytes: value.documentSizeBytes, documentUploadedAt: uploadedAt });
    }
    return result;
  }
}
