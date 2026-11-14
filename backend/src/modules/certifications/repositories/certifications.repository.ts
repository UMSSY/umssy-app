import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { mapRecordNotFound } from '../../../common/utils/map-record-not-found.js';
import { CertificationNotFoundException } from '../exceptions/certification-not-found.exception.js';
import type { CreateCertificationRequest } from '../requests/create-certification.request.js';
import type { UpdateCertificationRequest } from '../requests/update-certification.request.js';
import type { CertificationDocumentData } from '../../certification-documents/types/certification-document-data.type.js';

const certificationSelect = {
  id: true,
  userId: true,
  name: true,
  issuingOrganization: true,
  issueDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CertificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublicationEvidenceIds(userId: string, context: TransactionContext) {
    return context.client.$queryRaw<{id:string}[]>`
      SELECT c.id FROM certifications c WHERE c.user_id=${userId}::uuid
      AND NOT EXISTS (SELECT 1 FROM radar_document_verifications d WHERE d.source_type='certification' AND d.source_id=c.id
        AND d.active AND d.status NOT IN ('legacy','approved','manual_approved'))`;
  }

  findManyByUserId(userId: string) {
    return this.prisma.certification.findMany({
      where: { userId },
      orderBy: { issueDate: 'desc' },
      select: certificationSelect,
    });
  }

  findById(id: string) {
    return this.prisma.certification.findUnique({
      where: { id },
      select: certificationSelect,
    });
  }

  create(
    userId: string,
    data: CreateCertificationRequest,
    document?: CertificationDocumentData,
    context?: TransactionContext,
  ) {
    const client = context?.client ?? this.prisma;
    return client.certification.create({
      data: {
        ...data,
        userId,
        ...(document && { documentUrl: document.documentUrl }),
      },
      select: certificationSelect,
    });
  }

  update(
    id: string,
    data: UpdateCertificationRequest,
    document?: CertificationDocumentData,
    context?: TransactionContext,
  ) {
    const client = context?.client ?? this.prisma;
    return mapRecordNotFound(
      client.certification.update({
        where: { id },
        data: {
          ...data,
          ...(document && { documentUrl: document.documentUrl }),
        },
        select: certificationSelect,
      }),
      () => new CertificationNotFoundException(),
    );
  }

  async delete(id: string): Promise<void> {
    await mapRecordNotFound(
      this.prisma.certification.delete({ where: { id } }),
      () => new CertificationNotFoundException(),
    );
  }
}
