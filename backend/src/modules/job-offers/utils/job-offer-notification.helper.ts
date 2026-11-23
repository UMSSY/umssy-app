import { Logger } from '@nestjs/common';
import type { NotificationsService } from '../../notifications/services/notifications.service.js';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import type { NotificationType } from '../../notifications/types/notification-type.enum.js';
import {
  buildJobOfferActionUrl,
  JobOfferPublishedPayloadSchema,
} from '../requests/job-offer-published.payload.js';
import type { NotifyRequest } from '../../notifications/types/notify-request.type.js';

export type VacancyAlertPreference = 'ALL' | 'MATCHING' | 'HIGH_AFFINITY';

export interface CandidateEligibilityInput {
  userId: string;
  isActiveStudentOrGraduate: boolean;
  skillsCount: number;
  affinityPercentage: number;
  savedPreference?: VacancyAlertPreference | null;
}

export interface JobOfferNotificationIdempotency {
  hasNotified(jobOfferId: string): Promise<boolean>;
  markNotified(jobOfferId: string): Promise<void>;
}

export function resolveEligibleRecipientIds(
  candidates: CandidateEligibilityInput[],
): string[] {
  const eligibleIds = candidates
    .filter((candidate) => {
      if (!candidate.isActiveStudentOrGraduate) return false;

      // Sin habilidades (0) o sin preferencia previa -> regla efectiva "Todas las vacantes"
      const effectivePreference: VacancyAlertPreference =
        candidate.skillsCount <= 0 || !candidate.savedPreference
          ? 'ALL'
          : candidate.savedPreference;

      if (effectivePreference === 'ALL') return true;
      if (effectivePreference === 'MATCHING') {
        return candidate.affinityPercentage > 0;
      }
      return candidate.affinityPercentage >= 70;
    })
    .map((candidate) => candidate.userId);

  return [...new Set(eligibleIds)];
}

export async function notifyNewJobOfferPublished(params: {
  logger: Logger;
  notificationsService: NotificationsService;
  jobOfferId: string;
  jobTitle: string;
  companyName: string;
  candidates?: CandidateEligibilityInput[];
  idempotency?: JobOfferNotificationIdempotency;
}): Promise<void> {
  const {
    logger,
    notificationsService,
    jobOfferId,
    jobTitle,
    companyName,
    candidates = [],
    idempotency,
  } = params;

  try {
    if (idempotency && (await idempotency.hasNotified(jobOfferId))) {
      logger.warn(
        `Aviso JOB_OFFER_PUBLISHED ya enviado para vacante ${jobOfferId}; se omite duplicado.`,
      );
      return;
    }

    const payload = JobOfferPublishedPayloadSchema.parse({
      jobTitle,
      companyName,
    });

    const recipientIds = resolveEligibleRecipientIds(candidates);
    if (recipientIds.length === 0) {
      logger.log(
        `No hay destinatarios elegibles para vacante ${jobOfferId}.`,
      );
      return;
    }

    // TODO: Una vez que el PR de Epic 9 llegue a tu rama / develop, importar NotificationType
    // como valor y reemplazar ambos casts por NotificationType.JOB_OFFER_PUBLISHED y el tipo oficial del payload.
    await notificationsService.notify({
      recipientIds,
      type: 'JOB_OFFER_PUBLISHED',
      payload,
      actionUrl: buildJobOfferActionUrl(jobOfferId),
    } as unknown as NotifyRequest);

    if (idempotency) {
      await idempotency.markNotified(jobOfferId);
    }
  } catch (error) {
    // Un fallo del servicio de notificaciones nunca debe interrumpir la creación de la vacante
    logger.error(
      `Fallo al notificar nueva vacante ${jobOfferId}`,
      error instanceof Error ? error.stack : String(error),
    );
  }
}