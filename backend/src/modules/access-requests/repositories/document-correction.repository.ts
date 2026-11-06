import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { Prisma } from '../../../prisma/client.js';
import { ACCESS_REQUEST_AUDIT_SELECT } from '../constants/access-request-audit-select.constants.js';
import { DOCUMENT_CORRECTION_SELECT } from '../constants/document-correction-select.constants.js';
import { ActiveAccessRequestExistsException } from '../exceptions/active-access-request-exists.exception.js';
import { DocumentCorrectionConflictException } from '../exceptions/document-correction-conflict.exception.js';
import { ACCESS_REQUEST_STATUS } from '../types/access-request.enum.js';
import type { DocumentCorrectionResponse, ReplaceRejectedDocumentOperation } from '../types/document-correction.types.js';

@Injectable()
export class DocumentCorrectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.accessRequest.findUnique({ where: { id }, select: DOCUMENT_CORRECTION_SELECT });
  }

  findByCode(requestCode: string) {
    return this.prisma.accessRequest.findUnique({ where: { requestCode }, select: DOCUMENT_CORRECTION_SELECT });
  }

  async replaceRejectedDocument(operation: ReplaceRejectedDocumentOperation): Promise<DocumentCorrectionResponse> {
    const { context, documentType, createFile, onReplaced } = operation;
    try {
      return await this.prisma.$transaction(async (tx): Promise<DocumentCorrectionResponse> => {
        // Reserva la revisión antes de guardar el archivo. Una segunda operación
        // sobre esa misma revisión no puede superar esta condición atómica.
        const previous = await tx.accessRequest.update({
          where: {
            id: context.accessRequestId,
            requestCode: context.requestCode,
            status: { title: ACCESS_REQUEST_STATUS.REJECTED },
            AND: [{ documentFileId: context.previousFileId }],
            updatedAt: context.revision,
          },
          data: { status: { connect: { title: ACCESS_REQUEST_STATUS.PENDING } } },
          select: ACCESS_REQUEST_AUDIT_SELECT,
        });

        const file = await createFile(tx);
        await tx.accessRequest.update({
          where: { id: context.accessRequestId },
          data: {
            documentFile: { connect: { id: file.id } },
            documentType: { connect: { title: documentType } },
            rejectionReason: null,
            reviewedAt: null,
            reviewedBy: { disconnect: true },
            openedAt: null,
            openedBy: { disconnect: true },
          },
          select: { id: true },
        });

        await onReplaced(previous, file, tx);
        return { requestCode: context.requestCode, status: ACCESS_REQUEST_STATUS.PENDING };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') throw new DocumentCorrectionConflictException();
        if (error.code === 'P2002') throw new ActiveAccessRequestExistsException();
      }
      throw error;
    }
  }
}
