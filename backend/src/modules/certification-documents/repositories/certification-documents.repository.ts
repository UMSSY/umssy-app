import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { mapRecordNotFound } from '../../../common/utils/map-record-not-found.js';
import { CertificationNotFoundException } from '../../certifications/exceptions/certification-not-found.exception.js';
import type { CertificationDocumentMetadata } from '../types/certification-document-metadata.type.js';
import { RadarAuditRepository } from '../../radar-integration/radar-audit.repository.js';

const documentSelect = { documentUrl: true } as const;

const idSelect = { id: true } as const;

@Injectable()
export class CertificationDocumentsRepository {
  constructor(private readonly prisma: PrismaService, private readonly audit: RadarAuditRepository) {}

  async save(id: string, content: Buffer, metadata?: CertificationDocumentMetadata): Promise<void> {
    if (metadata) {
      await mapRecordNotFound(this.prisma.$transaction(async tx => {
        const row = await tx.certification.update({ where: { id }, data: { documentUrl: new Uint8Array(content) }, select: { id: true, userId: true } });
        await this.audit.saveDocumentMetadata(row.userId, id, metadata, tx);
      }), () => new CertificationNotFoundException());
      return;
    }
    await mapRecordNotFound(
      this.prisma.certification.update({
        where: { id },
        data: { documentUrl: new Uint8Array(content) },
        select: idSelect,
      }),
      () => new CertificationNotFoundException(),
    );
  }

  async read(id: string): Promise<Buffer | null> {
    const record = await this.prisma.certification.findUnique({
      where: { id },
      select: documentSelect,
    });

    return record?.documentUrl ? Buffer.from(record.documentUrl) : null;
  }

  async remove(id: string): Promise<void> {
    await mapRecordNotFound(
      this.prisma.$transaction(async tx => {
        const row = await tx.certification.update({ where: { id }, data: { documentUrl: null }, select: { id: true, userId: true } });
        await this.audit.saveDocumentMetadata(row.userId, id, null, tx);
      }),
      () => new CertificationNotFoundException(),
    );
  }

  async hasDocument(id: string): Promise<boolean> {
    const record = await this.prisma.certification.findFirst({
      where: { id, documentUrl: { not: null } },
      select: idSelect,
    });

    return record !== null;
  }

  async findIdsWithDocument(userId: string): Promise<Set<string>> {
    const records = await this.prisma.certification.findMany({
      where: { userId, documentUrl: { not: null } },
      select: idSelect,
    });

    return new Set(records.map((record) => record.id));
  }
}
