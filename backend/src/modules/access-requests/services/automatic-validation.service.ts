import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../../prisma/client.js';
import { toBoliviaTime, toUtcIso } from '../../../common/utils/date-time.js';
import { AuditEventRecorderService } from '../../audit-events/services/audit-event-recorder.service.js';
import { VALIDATION_REASONS } from '../constants/automatic-validation.constants.js';
import { AccessRequestNotFoundException, ApprovalNotRevertibleException } from '../exceptions/index.js';
import { evaluateDocumentReading } from '../helpers/evaluate-document-reading.js';
import {
  toActivationCodeSentAuditEvent,
  toApprovalRevertedAuditEvent,
  toAutomaticApprovalAuditEvent,
  toAutomaticRejectionAuditEvent,
  toManualReviewAuditEvent,
  toOcrReadAuditEvent,
} from '../mappers/access-request-audit-event.mapper.js';
import { DocumentValidationRepository } from '../repositories/document-validation.repository.js';
import { ACCESS_REQUEST_STATUS } from '../types/access-request.enum.js';
import type { AccessRequestAuditSource } from '../types/access-request-audit.types.js';
import { VALIDATION_RESULT } from '../types/document-validation.enum.js';
import type { DocumentReading } from '../types/document-reading.types.js';
import type { DocumentEvaluation } from '../types/document-validation.types.js';
import { ActivationOtpService } from './activation-otp.service.js';
import { RejectionNotificationService } from './rejection-notification.service.js';

const isRecordNotFound = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';

@Injectable()
export class AutomaticValidationService {
  private readonly logger = new Logger(AutomaticValidationService.name);

  constructor(
    private readonly documentValidationRepository: DocumentValidationRepository,
    private readonly auditEventRecorder: AuditEventRecorderService,
    private readonly activationOtpService: ActivationOtpService,
    private readonly rejectionNotificationService: RejectionNotificationService,
  ) {}

  async evaluateReading(accessRequestId: string, reading: DocumentReading, now: Date = new Date(), expectedDocumentFileId?: string) {
    const current = await this.documentValidationRepository.findAutomationState(accessRequestId);
    if (!current?.documentValidation) {
      throw new AccessRequestNotFoundException();
    }
    const evaluation = evaluateDocumentReading(
      { firstName: current.firstName, lastName: current.lastName, career: current.career.title, graduationYear: current.graduationYear },
      reading,
    );

    const decide = current.status.title === ACCESS_REQUEST_STATUS.PENDING;
    const saved =
      (await this.save(accessRequestId, decide ? evaluation : this.asReference(evaluation), decide, now, expectedDocumentFileId)) ??
      (await this.save(accessRequestId, this.asReference(evaluation), false, now, expectedDocumentFileId));
    if (!saved) {
      throw new AccessRequestNotFoundException();
    }
    const stored = saved.evaluation;

    let activationCodeSent = false;
    let notificationSent = false;
    if (saved.decided && stored.result === VALIDATION_RESULT.AUTO_APPROVED) {
      activationCodeSent = await this.activationOtpService.issueFor(accessRequestId, current.email);
      if (activationCodeSent) {
        await this.recordAfterCommit(accessRequestId, saved.source, current.email);
      }
    }
    if (saved.decided && stored.result === VALIDATION_RESULT.AUTO_REJECTED && stored.reason) {
      notificationSent = await this.rejectionNotificationService.notify(current.email, stored.reason, accessRequestId);
    }
    return { accessRequestId, result: stored.result, matchScore: stored.matchScore, reason: stored.reason, activationCodeSent, notificationSent };
  }

  async markOcrFailed(accessRequestId: string, documentFileId: string, now: Date = new Date()) {
    return this.documentValidationRepository.markOcrFailed(accessRequestId, documentFileId, now, (source, tx) =>
      this.auditEventRecorder.record(toManualReviewAuditEvent(source, VALIDATION_REASONS.OCR_FAILED), tx),
    );
  }

  async getSummary(now: Date = new Date()) {
    const todayStart = new Date(toUtcIso(toBoliviaTime(now).date, '00:00'));
    const [manualReviewCount, autoApprovedTodayCount, autoRejectedTodayCount, receivedTodayCount] = await Promise.all([
      this.documentValidationRepository.countManualReview(),
      this.documentValidationRepository.countAutomaticDecisions(VALIDATION_RESULT.AUTO_APPROVED, todayStart),
      this.documentValidationRepository.countAutomaticDecisions(VALIDATION_RESULT.AUTO_REJECTED, todayStart),
      this.documentValidationRepository.countReceivedSince(todayStart),
    ]);
    return { manualReviewCount, autoApprovedTodayCount, autoRejectedTodayCount, receivedTodayCount };
  }

  async revertApproval(accessRequestId: string, adminId: string, now: Date = new Date()) {
    const current = await this.documentValidationRepository.findAutomationState(accessRequestId);
    if (!current) {
      throw new AccessRequestNotFoundException();
    }
    if (current.status.title !== ACCESS_REQUEST_STATUS.APPROVED || current.documentValidation?.result !== VALIDATION_RESULT.AUTO_APPROVED) {
      throw new ApprovalNotRevertibleException();
    }
    if (current.activationOtps.length > 0) {
      throw new ApprovalNotRevertibleException('La persona titulada ya activó su cuenta; la aprobación no se puede revertir');
    }
    await this.documentValidationRepository.revertApproval(accessRequestId, adminId, now, (source, tx) =>
      this.auditEventRecorder.record(toApprovalRevertedAuditEvent(source, adminId), tx),
    );
    return { id: accessRequestId, status: ACCESS_REQUEST_STATUS.IN_REVIEW, validation: VALIDATION_RESULT.MANUAL_REVIEW };
  }

  private asReference(evaluation: DocumentEvaluation): DocumentEvaluation {
    if (evaluation.result === VALIDATION_RESULT.MANUAL_REVIEW) return evaluation;
    return { ...evaluation, result: VALIDATION_RESULT.MANUAL_REVIEW, reason: evaluation.reason ?? VALIDATION_REASONS.ALREADY_IN_REVIEW };
  }

  private async save(accessRequestId: string, evaluation: DocumentEvaluation, decide: boolean, now: Date, expectedDocumentFileId?: string) {
    try {
      const { decided, source } = await this.documentValidationRepository.saveEvaluation(
        { accessRequestId, ...evaluation, decide, now, ...(expectedDocumentFileId !== undefined && { expectedDocumentFileId }) },
        async (savedSource, tx) => {
          await this.auditEventRecorder.record(toOcrReadAuditEvent(savedSource, evaluation.matchScore), tx);
          if (!decide) return;
          await this.auditEventRecorder.record(this.decisionEvent(savedSource, evaluation), tx);
        },
      );
      return { decided, source, evaluation };
    } catch (error) {
      if ((decide || expectedDocumentFileId !== undefined) && isRecordNotFound(error)) return null;
      throw error;
    }
  }

  private decisionEvent(source: AccessRequestAuditSource, evaluation: DocumentEvaluation) {
    if (evaluation.result === VALIDATION_RESULT.AUTO_APPROVED) return toAutomaticApprovalAuditEvent(source, evaluation.matchScore);
    if (evaluation.result === VALIDATION_RESULT.AUTO_REJECTED) return toAutomaticRejectionAuditEvent(source, evaluation.reason ?? VALIDATION_REASONS.ILLEGIBLE);
    return toManualReviewAuditEvent(source, evaluation.reason ?? VALIDATION_REASONS.BELOW_THRESHOLD);
  }

  private async recordAfterCommit(accessRequestId: string, source: AccessRequestAuditSource, email: string) {
    try {
      await this.auditEventRecorder.record(toActivationCodeSentAuditEvent(source, email));
    } catch (error) {
      this.logger.error(
        `No se pudo registrar el envío del código de la solicitud ${accessRequestId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
