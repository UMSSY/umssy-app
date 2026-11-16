import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import type { UsersService } from '../../users/services/users.service.js';
import {
  SurveyNotFoundException,
  SurveyReminderDeliveryFailedException,
  SurveyReminderNotAllowedException,
  SurveyWithoutPendingRespondentsException,
} from '../exceptions/index.js';
import type { SurveysRepository } from '../repositories/surveys.repository.js';
import { SurveyParticipationService } from '../services/survey-participation.service.js';
import type { SurveyParticipationTarget } from '../types/survey-participation-target.type.js';

const NOW = new Date('2026-11-15T12:00:00.000Z');

const TARGET: SurveyParticipationTarget = {
  id: 'survey-1',
  title: 'Empleabilidad 2020',
  academicPeriod: '2020',
  closesAt: new Date('2026-12-01T00:00:00.000Z'),
  lastReminderSentAt: new Date('2026-11-05T14:00:00.000Z'),
  status: { title: 'published' },
  targetAudience: { title: 'graduates' },
  career: { id: 'career-1', title: 'Ingeniería de Sistemas' },
};

const RESPONDED_IDS = Array.from({ length: 48 }, (_, i) => `user-resp-${i}`);

const PENDING = [
  { id: 'user-2', email: 'ana@umss.edu.bo', firstName: 'Ana', lastName: 'Rojas' },
  { id: 'user-3', email: 'luis@umss.edu.bo', firstName: 'Luis', lastName: 'Paz' },
];

describe('SurveyParticipationService', () => {
  let repository: {
    findParticipationTarget: ReturnType<typeof vi.fn>;
    findRespondedUserIds: ReturnType<typeof vi.fn>;
    updateLastReminderSent: ReturnType<typeof vi.fn>;
  };
  let usersService: {
    countAudienceUsers: ReturnType<typeof vi.fn>;
    findAudienceRecipients: ReturnType<typeof vi.fn>;
  };
  let notificationsService: { notify: ReturnType<typeof vi.fn> };
  let service: SurveyParticipationService;

  beforeEach(() => {
    repository = {
      findParticipationTarget: vi.fn().mockResolvedValue(TARGET),
      findRespondedUserIds: vi.fn().mockResolvedValue(RESPONDED_IDS),
      updateLastReminderSent: vi.fn().mockResolvedValue(undefined),
    };
    usersService = {
      countAudienceUsers: vi.fn().mockResolvedValue(120),
      findAudienceRecipients: vi.fn().mockResolvedValue(PENDING),
    };
    notificationsService = {
      notify: vi.fn().mockResolvedValue({
        inAppCount: 2,
        pushStatus: 'sent',
        emailStatus: 'sent',
        emailsDelivered: 2,
        emailsFailed: 0,
      }),
    };
    service = new SurveyParticipationService(
      repository as unknown as SurveysRepository,
      usersService as unknown as UsersService,
      notificationsService as unknown as NotificationsService,
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
      expect(repository.findRespondedUserIds).toHaveBeenCalledWith('survey-1');
      expect(usersService.countAudienceUsers).toHaveBeenCalledWith({
        roles: ['titulado'],
        careerId: 'career-1',
        graduationYear: 2020,
      });
    });

    it('deshabilita el recordatorio cuando no hay pendientes', async () => {
      usersService.countAudienceUsers.mockResolvedValue(48);

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
    it('envía notificaciones a través de notify() solo a los pendientes y registra la fecha', async () => {
      const result = await service.sendReminders('survey-1', 'admin-1', NOW);

      expect(usersService.findAudienceRecipients).toHaveBeenCalledWith({
        roles: ['titulado'],
        careerId: 'career-1',
        graduationYear: 2020,
        excludedUserIds: RESPONDED_IDS,
      });
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientIds: ['user-2', 'user-3'],
          actorId: 'admin-1',
          type: NotificationType.SURVEY_REMINDER,
          payload: expect.objectContaining({
            surveyTitle: 'Empleabilidad 2020',
          }),
        }),
      );
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
      notificationsService.notify.mockResolvedValue({
        inAppCount: 2,
        pushStatus: 'sent',
        emailStatus: 'partial',
        emailsDelivered: 1,
        emailsFailed: 1,
      });

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).resolves.toMatchObject({ emailsDelivered: 1, emailsFailed: 1 });
    });

    it('no registra el recordatorio si el servicio unificado falla completamente', async () => {
      notificationsService.notify.mockResolvedValue({
        inAppCount: 0,
        pushStatus: 'failed',
        emailStatus: 'failed',
        emailsDelivered: 0,
        emailsFailed: 2,
      });

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).rejects.toThrow(SurveyReminderDeliveryFailedException);
      expect(repository.updateLastReminderSent).not.toHaveBeenCalled();
    });

    it('informa el estado de push', async () => {
      notificationsService.notify.mockResolvedValue({
        inAppCount: 2,
        pushStatus: 'failed',
        emailStatus: 'sent',
        emailsDelivered: 2,
        emailsFailed: 0,
      });

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).resolves.toMatchObject({ emailsDelivered: 2, pushStatus: 'failed' });
    });

    it('rechaza el envío si todos ya respondieron', async () => {
      usersService.findAudienceRecipients.mockResolvedValue([]);

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
      expect(usersService.findAudienceRecipients).not.toHaveBeenCalled();
    });
  });
});
