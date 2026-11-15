import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MailService } from '../../mail/services/mail.service.js';
import type { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import {
  SurveyNotFoundException,
  SurveyReminderDeliveryFailedException,
  SurveyReminderNotAllowedException,
  SurveyWithoutPendingRespondentsException,
} from '../exceptions/index.js';
import type { SurveysRepository } from '../repositories/surveys.repository.js';
import { SurveyParticipationService } from '../services/survey-participation.service.js';
import type { SurveyParticipationTarget } from '../types/survey-participation-target.type.js';

vi.mock('../../mail/helpers/load-mail-template.js', () => ({
  loadMailTemplate: vi.fn().mockResolvedValue('<mjml />'),
}));

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

const EXPECTED_FILTER = {
  surveyId: 'survey-1',
  roles: ['titulado'],
  careerId: 'career-1',
  graduationYear: 2020,
};

const PENDING = [
  { id: 'user-2', email: 'ana@umss.edu.bo', firstName: 'Ana', lastName: 'Rojas' },
  { id: 'user-3', email: 'luis@umss.edu.bo', firstName: 'Luis', lastName: 'Paz' },
];

describe('SurveyParticipationService', () => {
  let repository: {
    findParticipationTarget: ReturnType<typeof vi.fn>;
    countEligibleRespondents: ReturnType<typeof vi.fn>;
    findPendingRecipients: ReturnType<typeof vi.fn>;
    updateLastReminderSent: ReturnType<typeof vi.fn>;
  };
  let mailService: { send: ReturnType<typeof vi.fn> };
  let notificationsService: { notify: ReturnType<typeof vi.fn> };
  let service: SurveyParticipationService;

  beforeEach(() => {
    repository = {
      findParticipationTarget: vi.fn().mockResolvedValue(TARGET),
      countEligibleRespondents: vi.fn(
        (_filter: unknown, hasResponded?: boolean) =>
          Promise.resolve(hasResponded ? 48 : 120),
      ),
      findPendingRecipients: vi.fn().mockResolvedValue(PENDING),
      updateLastReminderSent: vi.fn().mockResolvedValue(undefined),
    };
    mailService = { send: vi.fn().mockResolvedValue(undefined) };
    notificationsService = {
      notify: vi.fn().mockResolvedValue({
        inAppCount: 2,
        pushStatus: 'sent',
        emailStatus: 'skipped',
      }),
    };
    service = new SurveyParticipationService(
      repository as unknown as SurveysRepository,
      mailService as unknown as MailService,
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
      expect(repository.countEligibleRespondents).toHaveBeenCalledWith(
        EXPECTED_FILTER,
      );
      expect(repository.countEligibleRespondents).toHaveBeenCalledWith(
        EXPECTED_FILTER,
        true,
      );
    });

    it('deshabilita el recordatorio cuando no hay pendientes', async () => {
      repository.countEligibleRespondents.mockResolvedValue(10);

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
    it('envía correos y push solo a los pendientes y registra la fecha del recordatorio', async () => {
      const result = await service.sendReminders('survey-1', 'admin-1', NOW);

      expect(repository.findPendingRecipients).toHaveBeenCalledWith(
        EXPECTED_FILTER,
      );
      expect(mailService.send).toHaveBeenCalledTimes(2);
      expect(mailService.send.mock.calls.map(([mail]) => mail.to)).toEqual([
        'ana@umss.edu.bo',
        'luis@umss.edu.bo',
      ]);
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientIds: ['user-2', 'user-3'],
          actorId: 'admin-1',
          type: NotificationType.SURVEY_REMINDER,
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
      mailService.send
        .mockRejectedValueOnce(new Error('smtp'))
        .mockResolvedValueOnce(undefined);

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).resolves.toMatchObject({ emailsDelivered: 1, emailsFailed: 1 });
    });

    it('no registra el recordatorio si ningún correo se entregó', async () => {
      mailService.send.mockRejectedValue(new Error('smtp'));

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).rejects.toThrow(SurveyReminderDeliveryFailedException);
      expect(repository.updateLastReminderSent).not.toHaveBeenCalled();
      expect(notificationsService.notify).not.toHaveBeenCalled();
    });

    it('informa el fallo de push sin ocultar los correos entregados', async () => {
      notificationsService.notify.mockRejectedValue(new Error('catalog'));

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).resolves.toMatchObject({ emailsDelivered: 2, pushStatus: 'failed' });
    });

    it('rechaza el envío si todos ya respondieron', async () => {
      repository.findPendingRecipients.mockResolvedValue([]);

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).rejects.toThrow(SurveyWithoutPendingRespondentsException);
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('rechaza el envío para encuestas cerradas', async () => {
      repository.findParticipationTarget.mockResolvedValue({
        ...TARGET,
        closesAt: new Date('2026-11-01T00:00:00.000Z'),
      });

      await expect(
        service.sendReminders('survey-1', 'admin-1', NOW),
      ).rejects.toThrow(SurveyReminderNotAllowedException);
      expect(repository.findPendingRecipients).not.toHaveBeenCalled();
    });
  });
});
