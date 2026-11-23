import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import type { NotifyResult } from '../../notifications/types/notify-result.type.js';
import {
  SurveyNotFoundException,
  SurveyReminderDeliveryFailedException,
  SurveyReminderNotAllowedException,
  SurveyWithoutPendingRespondentsException,
} from '../exceptions/index.js';
import type { SurveysRepository } from '../repositories/surveys.repository.js';
import type { SurveyAudienceService } from '../services/survey-audience.service.js';
import { SurveyParticipationService } from '../services/survey-participation.service.js';
import type { SurveyParticipationTarget } from '../types/survey-participation-target.type.js';

const NOW = new Date('2026-11-15T12:00:00.000Z');

const TARGET: SurveyParticipationTarget = {
  id: 'survey-1',
  title: 'Empleabilidad 2020',
  academicPeriod: '2020',
  closesAt: new Date('2026-12-01T00:00:00.000Z'),
  lastReminderSentAt: new Date('2026-11-05T14:00:00.000Z'),
  publishedNotifiedPeriod: null,
  status: { title: 'published' },
  targetAudience: { title: 'graduates' },
  career: { id: 'career-1', title: 'Ingeniería de Sistemas' },
};

const EXPECTED_FILTER = {
  surveyId: 'survey-1',
  roles: ['titulado'],
  careerId: 'career-1',
  graduationYear: 2020,
};

const contact = (id: string) => ({
  id,
  email: `${id}@umss.edu.bo`,
  firstName: 'Nombre',
  lastName: 'Apellido',
});

const ELIGIBLE = Array.from({ length: 120 }, (_, index) =>
  contact(`user-${index + 1}`),
);
const PENDING = [contact('user-2'), contact('user-3')];

const notifyResult = (
  emailStatuses: Array<'sent' | 'failed'>,
  pushStatus: NotifyResult['pushStatus'] = 'sent',
): NotifyResult => ({
  inAppCount: PENDING.length,
  pushStatus,
  emailStatus: 'sent',
  deliveries: emailStatuses.map((status, index) => ({
    recipientId: PENDING[index]?.id ?? `user-${index}`,
    channel: 'email',
    status,
  })),
});

describe('SurveyParticipationService', () => {
  let repository: {
    findParticipationTarget: ReturnType<typeof vi.fn>;
    updateLastReminderSent: ReturnType<typeof vi.fn>;
  };
  let audienceService: { resolve: ReturnType<typeof vi.fn> };
  let notificationsService: { notify: ReturnType<typeof vi.fn> };
  let service: SurveyParticipationService;

  beforeEach(() => {
    repository = {
      findParticipationTarget: vi.fn().mockResolvedValue(TARGET),
      updateLastReminderSent: vi.fn().mockResolvedValue(undefined),
    };
    audienceService = {
      resolve: vi.fn().mockResolvedValue({
        eligible: ELIGIBLE,
        pending: ELIGIBLE.slice(48),
      }),
    };
    notificationsService = {
      notify: vi.fn().mockResolvedValue(notifyResult(['sent', 'sent'])),
    };
    service = new SurveyParticipationService(
      repository as unknown as SurveysRepository,
      audienceService as unknown as SurveyAudienceService,
      notificationsService as unknown as NotificationsService,
      { evaluateSurvey: vi.fn() } as never,
    );
  });

  describe('getParticipation', () => {
    it('calcula elegibles, respondidos, pendientes y porcentaje sobre la audiencia objetivo', async () => {
      await expect(service.getParticipation('survey-1', NOW)).resolves.toEqual({
        surveyId: 'survey-1',
        respondedCount: 48,
        eligibleCount: 120,
        pendingCount: 72,
        responseRate: 40,
        audienceLabel: 'Titulados · Ingeniería de Sistemas · Gestión 2020',
        lastReminderSentAt: '2026-11-05T14:00:00.000Z',
        canSendReminder: true,
      });
      expect(audienceService.resolve).toHaveBeenCalledWith(EXPECTED_FILTER);
    });

    it('deshabilita el recordatorio cuando no hay pendientes', async () => {
      audienceService.resolve.mockResolvedValue({
        eligible: ELIGIBLE.slice(0, 10),
        pending: [],
      });

      await expect(
        service.getParticipation('survey-1', NOW),
      ).resolves.toMatchObject({
        pendingCount: 0,
        responseRate: 100,
        canSendReminder: false,
      });
    });

    it('falla si la encuesta no existe', async () => {
      repository.findParticipationTarget.mockResolvedValue(null);

      await expect(service.getParticipation('survey-x', NOW)).rejects.toThrow(
        SurveyNotFoundException,
      );
    });
  });

  describe('sendReminders', () => {
    beforeEach(() => {
      audienceService.resolve.mockResolvedValue({
        eligible: ELIGIBLE,
        pending: PENDING,
      });
    });

    it('envía el recordatorio a los pendientes mediante el servicio unificado y registra la fecha', async () => {
      const result = await service.sendReminders('survey-1', 'admin-1', NOW);

      expect(notificationsService.notify).toHaveBeenCalledTimes(1);
      expect(notificationsService.notify).toHaveBeenCalledWith({
        recipientIds: ['user-2', 'user-3'],
        actorId: 'admin-1',
        type: NotificationType.SURVEY_REMINDER,
        payload: {
          surveyTitle: 'Empleabilidad 2020',
          closesAtFormatted: '30/11/2026 20:00.',
        },
        actionUrl: expect.stringMatching(/\/surveys\/survey-1$/),
        groupKey: 'survey-reminder:survey-1',
        renderMail: expect.any(Function),
      });
      expect(repository.updateLastReminderSent).toHaveBeenCalledWith(
        'survey-1',
        NOW,
      );
      expect(result).toEqual({
        surveyId: 'survey-1',
        pendingCount: 2,
        emailsDelivered: 2,
        emailsFailed: 0,
        pushStatus: 'sent',
        sentAt: NOW.toISOString(),
      });
    });

    it('devuelve la cantidad exacta entregada cuando algunos correos fallan', async () => {
      notificationsService.notify.mockResolvedValue(
        notifyResult(['failed', 'sent']),
      );

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).resolves.toMatchObject({ emailsDelivered: 1, emailsFailed: 1 });
    });

    it('no registra el recordatorio si ningún canal externo lo entregó', async () => {
      notificationsService.notify.mockResolvedValue(
        notifyResult(['failed', 'failed'], 'failed'),
      );

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).rejects.toThrow(SurveyReminderDeliveryFailedException);
      expect(repository.updateLastReminderSent).not.toHaveBeenCalled();
    });

    it('acepta el envío cuando solo el push fue entregado', async () => {
      notificationsService.notify.mockResolvedValue(
        notifyResult(['failed', 'failed'], 'partial'),
      );

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).resolves.toMatchObject({
        emailsDelivered: 0,
        emailsFailed: 2,
        pushStatus: 'partial',
      });
    });

    it('rechaza el envío si todos ya respondieron', async () => {
      audienceService.resolve.mockResolvedValue({
        eligible: ELIGIBLE,
        pending: [],
      });

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).rejects.toThrow(SurveyWithoutPendingRespondentsException);
      expect(notificationsService.notify).not.toHaveBeenCalled();
    });

    it('rechaza el envío para encuestas cerradas', async () => {
      repository.findParticipationTarget.mockResolvedValue({
        ...TARGET,
        closesAt: new Date('2026-11-01T00:00:00.000Z'),
      });

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).rejects.toThrow(SurveyReminderNotAllowedException);
      expect(audienceService.resolve).not.toHaveBeenCalled();
    });
  });
});
