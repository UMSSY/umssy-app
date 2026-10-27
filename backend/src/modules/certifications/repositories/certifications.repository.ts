import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { mapRecordNotFound } from '../../../common/utils/map-record-not-found.js';
import { RadarAuditRepository } from '../../radar-integration/radar-audit.repository.js';
import { CertificationNotFoundException } from '../exceptions/certification-not-found.exception.js';
import type { CreateCertificationRequest } from '../requests/create-certification.request.js';
import type { UpdateCertificationRequest } from '../requests/update-certification.request.js';
import type { CertificationRecord } from '../types/certification-record.type.js';
import type { CertificationDocumentData } from '../../certification-documents/types/certification-document-data.type.js';
import type { CertificationDocumentMetadata } from '../../certification-documents/types/certification-document-metadata.type.js';

const certificationSelect = { id: true, userId: true, name: true, issuingOrganization: true, issueDate: true, createdAt: true, updatedAt: true } as const;

function metadataOf(document: CertificationDocumentData): CertificationDocumentMetadata | null {
  if (document.documentUrl === null) return null;
  return { documentFileName: document.documentFileName, documentMimeType: document.documentMimeType, documentSizeBytes: document.documentSizeBytes, documentUploadedAt: document.documentUploadedAt };
}

@Injectable()
export class CertificationsRepository {
  constructor(private readonly prisma: PrismaService, private readonly audit: RadarAuditRepository) {}

  async findManyByUserId(userId: string): Promise<CertificationRecord[]> {
    const rows = await this.prisma.certification.findMany({ where: { userId }, orderBy: { issueDate: 'desc' }, select: certificationSelect });
    const metadata = await this.audit.findDocumentMetadata(userId, rows.map(row => row.id));
    return rows.map(row => ({ ...row, ...metadata.get(row.id) }));
  }

  async findById(id: string): Promise<CertificationRecord | null> {
    const row = await this.prisma.certification.findUnique({ where: { id }, select: certificationSelect });
    if (!row) return null;
    const metadata = await this.audit.findDocumentMetadata(row.userId, [id]);
    return { ...row, ...metadata.get(id) };
  }

  create(userId: string, data: CreateCertificationRequest, document?: CertificationDocumentData): Promise<CertificationRecord> {
    if (!document) return this.prisma.certification.create({ data: { ...data, userId }, select: certificationSelect });
    return this.prisma.$transaction(async tx => {
      const row = await tx.certification.create({ data: { ...data, userId, documentUrl: document.documentUrl }, select: certificationSelect });
      const metadata = metadataOf(document);
      await this.audit.saveDocumentMetadata(userId, row.id, metadata, tx);
      return { ...row, ...metadata };
    });
  }

  async update(id: string, data: UpdateCertificationRequest, document?: CertificationDocumentData): Promise<CertificationRecord> {
    if (document) {
      return mapRecordNotFound(this.prisma.$transaction(async tx => {
        const row = await tx.certification.update({ where: { id }, data: { ...data, documentUrl: document.documentUrl }, select: certificationSelect });
        const metadata = metadataOf(document);
        await this.audit.saveDocumentMetadata(row.userId, id, metadata, tx);
        return { ...row, ...metadata };
      }), () => new CertificationNotFoundException());
    }
    const row = await mapRecordNotFound(this.prisma.certification.update({ where: { id }, data, select: certificationSelect }), () => new CertificationNotFoundException());
    const metadata = await this.audit.findDocumentMetadata(row.userId, [id]);
    return { ...row, ...metadata.get(id) };
  }

  async delete(id: string): Promise<void> {
    await mapRecordNotFound(this.prisma.certification.delete({ where: { id } }), () => new CertificationNotFoundException());
  }
}