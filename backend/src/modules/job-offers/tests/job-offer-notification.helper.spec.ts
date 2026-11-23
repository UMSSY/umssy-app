import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationsService } from '../../notifications/services/notifications.service.js';
import {
  type CandidateEligibilityInput,
  type JobOfferNotificationIdempotency,
  notifyNewJobOfferPublished,
  resolveEligibleRecipientIds,
} from '../utils/job-offer-notification.helper.js';

describe('Job Offer Notification Helper', () => {
  let logger: Logger;
  let notificationsService: { notify: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    logger = new Logger('TestLogger');
    vi.spyOn(logger, 'log').mockImplementation(() => {});
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});

    notificationsService = {
      notify: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe('resolveEligibleRecipientIds', () => {
    it('filtra usuarios inactivos o que no son estudiantes/titulados activos', () => {
      const candidates: CandidateEligibilityInput[] = [
        {
          userId: 'u-inactive',
          isActiveStudentOrGraduate: false,
          skillsCount: 5,
          affinityPercentage: 95,
          savedPreference: 'ALL',
        },
        {
          userId: 'u-active',
          isActiveStudentOrGraduate: true,
          skillsCount: 3,
          affinityPercentage: 50,
          savedPreference: 'MATCHING',
        },
      ];

      expect(resolveEligibleRecipientIds(candidates)).toEqual(['u-active']);
    });

    it('aplica "Todas las vacantes" cuando el usuario nunca eligió preferencia', () => {
      const candidates: CandidateEligibilityInput[] = [
        {
          userId: 'u-no-pref',
          isActiveStudentOrGraduate: true,
          skillsCount: 2,
          affinityPercentage: 0,
          savedPreference: null,
        },
      ];

      expect(resolveEligibleRecipientIds(candidates)).toEqual(['u-no-pref']);
    });

    it('trata como "Todas las vacantes" si skillsCount es 0 aunque tenga preferencia guardada', () => {
      const candidates: CandidateEligibilityInput[] = [
        {
          userId: 'u-zero-skills-high',
          isActiveStudentOrGraduate: true,
          skillsCount: 0,
          affinityPercentage: 0,
          savedPreference: 'HIGH_AFFINITY',
        },
        {
          userId: 'u-zero-skills-matching',
          isActiveStudentOrGraduate: true,
          skillsCount: 0,
          affinityPercentage: 0,
          savedPreference: 'MATCHING',
        },
      ];

      expect(resolveEligibleRecipientIds(candidates)).toEqual([
        'u-zero-skills-high',
        'u-zero-skills-matching',
      ]);
    });

    it('filtra con afinidad > 0 para MATCHING y >= 70 para HIGH_AFFINITY', () => {
      const candidates: CandidateEligibilityInput[] = [
        {
          userId: 'match-zero',
          isActiveStudentOrGraduate: true,
          skillsCount: 2,
          affinityPercentage: 0,
          savedPreference: 'MATCHING',
        },
        {
          userId: 'match-positive',
          isActiveStudentOrGraduate: true,
          skillsCount: 2,
          affinityPercentage: 15,
          savedPreference: 'MATCHING',
        },
        {
          userId: 'high-69',
          isActiveStudentOrGraduate: true,
          skillsCount: 4,
          affinityPercentage: 69,
          savedPreference: 'HIGH_AFFINITY',
        },
        {
          userId: 'high-70',
          isActiveStudentOrGraduate: true,
          skillsCount: 4,
          affinityPercentage: 70,
          savedPreference: 'HIGH_AFFINITY',
        },
        {
          userId: 'high-90',
          isActiveStudentOrGraduate: true,
          skillsCount: 4,
          affinityPercentage: 90,
          savedPreference: 'HIGH_AFFINITY',
        },
      ];

      expect(resolveEligibleRecipientIds(candidates)).toEqual([
        'match-positive',
        'high-70',
        'high-90',
      ]);
    });

    it('elimina userId duplicados si vienen repetidos en la lista', () => {
      const candidates: CandidateEligibilityInput[] = [
        {
          userId: 'dup-1',
          isActiveStudentOrGraduate: true,
          skillsCount: 1,
          affinityPercentage: 80,
          savedPreference: 'ALL',
        },
        {
          userId: 'dup-1',
          isActiveStudentOrGraduate: true,
          skillsCount: 1,
          affinityPercentage: 80,
          savedPreference: 'ALL',
        },
      ];

      expect(resolveEligibleRecipientIds(candidates)).toEqual(['dup-1']);
    });
  });

  describe('notifyNewJobOfferPublished', () => {
    it('llama a notificationsService.notify con payload y actionUrl válidos', async () => {
      await notifyNewJobOfferPublished({
        logger,
        notificationsService: notificationsService as unknown as NotificationsService,
        jobOfferId: 'offer-123',
        jobTitle: 'Desarrollador Fullstack',
        companyName: 'UMSS Tech',
        candidates: [
          {
            userId: 'student-1',
            isActiveStudentOrGraduate: true,
            skillsCount: 3,
            affinityPercentage: 85,
            savedPreference: 'HIGH_AFFINITY',
          },
        ],
      });

      expect(notificationsService.notify).toHaveBeenCalledTimes(1);
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientIds: ['student-1'],
          payload: {
            jobTitle: 'Desarrollador Fullstack',
            companyName: 'UMSS Tech',
          },
          actionUrl: '/vacancies/offer-123',
        }),
      );
    });

    it('no envía notificación si ya fue marcada como notificada por idempotencia', async () => {
      const idempotency: JobOfferNotificationIdempotency = {
        hasNotified: vi.fn().mockResolvedValue(true),
        markNotified: vi.fn().mockResolvedValue(undefined),
      };

      await notifyNewJobOfferPublished({
        logger,
        notificationsService: notificationsService as unknown as NotificationsService,
        jobOfferId: 'offer-123',
        jobTitle: 'Desarrollador Fullstack',
        companyName: 'UMSS Tech',
        candidates: [
          {
            userId: 'student-1',
            isActiveStudentOrGraduate: true,
            skillsCount: 2,
            affinityPercentage: 100,
            savedPreference: 'ALL',
          },
        ],
        idempotency,
      });

      expect(notificationsService.notify).not.toHaveBeenCalled();
      expect(idempotency.markNotified).not.toHaveBeenCalled();
    });

    it('captura y registra el error sin lanzar excepción si notify() falla', async () => {
      notificationsService.notify.mockRejectedValueOnce(
        new Error('Notification service down'),
      );

      await expect(
        notifyNewJobOfferPublished({
          logger,
          notificationsService: notificationsService as unknown as NotificationsService,
          jobOfferId: 'offer-999',
          jobTitle: 'QA Engineer',
          companyName: 'Empresa ABC',
          candidates: [
            {
              userId: 'student-1',
              isActiveStudentOrGraduate: true,
              skillsCount: 2,
              affinityPercentage: 50,
              savedPreference: 'MATCHING',
            },
          ],
        }),
      ).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });
});