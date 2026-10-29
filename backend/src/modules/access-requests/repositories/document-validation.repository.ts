import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { Prisma } from '../../../prisma/client.js';
import { ACCESS_REQUEST_AUDIT_SELECT } from '../constants/access-request-audit-select.constants.js';
import { VALIDATION_REASONS } from '../constants/automatic-validation.constants.js';
import { ACCESS_REQUEST_STATUS } from '../types/access-request.enum.js';
import type { AccessRequestAuditHook } from '../types/access-request-audit.types.js';
import { VALIDATION_RESULT, type ValidationResult } from '../types/document-validation.enum.js';
import type { ValidationFieldOutcome } from '../types/document-validation.types.js';

type ValidationClient = Prisma.TransactionClient | PrismaService;

const VERDICT_BY_RESULT: Partial<Record<ValidationResult, string>> = {
  [VALIDATION_RESULT.AUTO_APPROVED]: ACCESS_REQUEST_STATUS.APPROVED,
  [VALIDATION_RESULT.AUTO_REJECTED]: ACCESS_REQUEST_STATUS.REJECTED,
};

const REVIEW_STATUSES: string[] = [ACCESS_REQUEST_STATUS.PENDING, ACCESS_REQUEST_STATUS.IN_REVIEW];

@Injectable()
export class DocumentValidationRepository {
  constructor(private readonly prisma: PrismaService) {}

  queue(accessRequestId: string, client: ValidationClient = this.prisma) {
    return client.documentValidation.upsert({
      where: { accessRequestId },
      create: { accessRequestId, result: VALIDATION_RESULT.QUEUED },
      update: {
        result: VALIDATION_RESULT.QUEUED,
        matchScore: null,
        reason: null,
        fieldResults: Prisma.DbNull,
        readAt: null,
        revertedAt: null,
        revertedBy: { disconnect: true },
      },
      select: { id: true },
    });
  }

  async markOcrFailed(accessRequestId: string, documentFileId: string, now: Date, onSaved: AccessRequestAuditHook) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const source = await tx.accessRequest.update({
          where: {
            id: accessRequestId,
            documentFileId,
            status: { title: { in: REVIEW_STATUSES } },
            documentValidation: { is: { result: VALIDATION_RESULT.QUEUED } },
          },
          data: { updatedAt: now },
          select: ACCESS_REQUEST_AUDIT_SELECT,
        });
        await tx.documentValidation.update({
          where: { accessRequestId },
          data: {
            result: VALIDATION_RESULT.MANUAL_REVIEW,
            matchScore: null,
            reason: VALIDATION_REASONS.OCR_FAILED,
            fieldResults: Prisma.DbNull,
            readAt: null,
          },
        });
        await onSaved(source, tx);
        return true;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return false;
      throw error;
    }
  }

  findQueuedRequests(take: number) {
    return this.prisma.accessRequest.findMany({
      where: {
        documentFileId: { not: null },
        status: { title: { in: REVIEW_STATUSES } },
        documentValidation: { is: { result: VALIDATION_RESULT.QUEUED } },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take,
    });
  }

  findAutomationState(accessRequestId: string) {
    return this.prisma.accessRequest.findUnique({
      where: { id: accessRequestId },
      select: {
        ...ACCESS_REQUEST_AUDIT_SELECT,
        email: true,
        graduationYear: true,
        status: { select: { title: true } },
        documentValidation: { select: { result: true } },
        activationOtps: { where: { usedAt: { not: null } }, select: { id: true }, take: 1 },
      } satisfies Prisma.AccessRequestSelect,
    });
  }

  saveEvaluation(
    params: { accessRequestId: string; result: ValidationResult; matchScore: number; reason: string | null; fields: ValidationFieldOutcome[]; decide: boolean; now: Date; expectedDocumentFileId?: string },
    onSaved: AccessRequestAuditHook,
  ) {
    const { accessRequestId, result, matchScore, reason, fields, decide, now, expectedDocumentFileId } = params;
    return this.prisma.$transaction(async (tx) => {
      if (expectedDocumentFileId !== undefined) {
        await tx.accessRequest.update({
          where: {
            id: accessRequestId,
            documentFileId: expectedDocumentFileId,
            status: { title: { in: REVIEW_STATUSES } },
            documentValidation: { is: { result: VALIDATION_RESULT.QUEUED } },
          },
          data: { updatedAt: now },
          select: { id: true },
        });
      }
      await tx.documentValidation.update({
        where: { accessRequestId },
        data: { result, matchScore, reason, fieldResults: fields as unknown as Prisma.InputJsonValue, readAt: now },
      });
      const verdict = decide ? VERDICT_BY_RESULT[result] : undefined;
      const source = verdict
        ? await tx.accessRequest.update({
            where: { id: accessRequestId, status: { title: ACCESS_REQUEST_STATUS.PENDING } },
            data: {
              status: { connect: { title: verdict } },
              reviewedAt: now,
              ...(verdict === ACCESS_REQUEST_STATUS.REJECTED && reason !== null && { rejectionReason: reason }),
            },
            select: ACCESS_REQUEST_AUDIT_SELECT,
          })
        : await tx.accessRequest.findUniqueOrThrow({ where: { id: accessRequestId }, select: ACCESS_REQUEST_AUDIT_SELECT });
      await onSaved(source, tx);
      return { decided: verdict !== undefined, source };
    });
  }

  revertApproval(accessRequestId: string, adminId: string, now: Date, onReverted: AccessRequestAuditHook) {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.accessRequest.update({
        where: { id: accessRequestId, status: { title: ACCESS_REQUEST_STATUS.APPROVED } },
        data: {
          status: { connect: { title: ACCESS_REQUEST_STATUS.IN_REVIEW } },
          reviewedBy: { connect: { id: adminId } },
          reviewedAt: now,
        },
        select: ACCESS_REQUEST_AUDIT_SELECT,
      });
      await tx.documentValidation.update({
        where: { accessRequestId },
        data: {
          result: VALIDATION_RESULT.MANUAL_REVIEW,
          reason: VALIDATION_REASONS.APPROVAL_REVERTED,
          revertedAt: now,
          revertedBy: { connect: { id: adminId } },
        },
      });
      await tx.activationOtp.deleteMany({ where: { accessRequestId, usedAt: null } });
      await onReverted(source, tx);
      return source;
    });
  }

  countManualReview() {
    return this.prisma.accessRequest.count({
      where: {
        status: { title: { in: REVIEW_STATUSES } },
        OR: [{ documentValidation: { is: { result: VALIDATION_RESULT.MANUAL_REVIEW } } }, { documentValidation: { is: null } }],
      },
    });
  }

  countAutomaticDecisions(result: ValidationResult, since: Date) {
    const status = VERDICT_BY_RESULT[result];
    return this.prisma.accessRequest.count({
      where: { status: { title: status }, reviewedAt: { gte: since }, documentValidation: { is: { result } } },
    });
  }

  countReceivedSince(since: Date) {
    return this.prisma.accessRequest.count({ where: { submittedAt: { gte: since } } });
  }
}
