import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { SurveyLifecycleWorkerService } from '../services/survey-lifecycle-worker.service.js';
import type { SurveysRepository } from '../repositories/surveys.repository.js';
import type { SurveyVariationEvaluatorService } from '../services/survey-variation-evaluator.service.js';
import type { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';

describe('SurveyLifecycleWorkerService', () => {
  let worker: SurveyLifecycleWorkerService;
  let repository: Partial<SurveysRepository>;
  let variationEvaluator: Partial<SurveyVariationEvaluatorService>;
  let notificationsService: { notify: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repository = {
      findSurveysClosingSoon: vi.fn(),
      findSurveysExpiredForClosure: vi.fn(),
      markClosingSoonNotified: vi.fn(),
      markClosedNotified: vi.fn(),
    };
    variationEvaluator = {
      evaluateSurvey: vi.fn(),
    };
    notificationsService = {
      notify: vi.fn().mockResolvedValue({
        inAppCount: 1,
        pushStatus: 'sent',
        emailStatus: 'sent',
      }),
    };
    worker = new SurveyLifecycleWorkerService(
      repository as SurveysRepository,
      variationEvaluator as SurveyVariationEvaluatorService,
      notificationsService as unknown as NotificationsService,
    );
  });

  afterEach(() => {
    worker.onModuleDestroy();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    beforeEach(() => {
      vi.mocked(repository.findSurveysClosingSoon!).mockResolvedValue([]);
      vi.mocked(repository.findSurveysExpiredForClosure!).mockResolvedValue(
        [],
      );
    });

    it('no inicia el timer en NODE_ENV=test', () => {
      vi.stubEnv('NODE_ENV', 'test');
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

      worker.onModuleInit();

      expect(setIntervalSpy).not.toHaveBeenCalled();
      expect(repository.findSurveysClosingSoon).not.toHaveBeenCalled();
    });

    it('inicia el timer y ejecuta el ciclo fuera de test', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.useFakeTimers();

      worker.onModuleInit();
      await vi.advanceTimersByTimeAsync(0);
      expect(repository.findSurveysClosingSoon).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(30_000);
      expect(repository.findSurveysClosingSoon).toHaveBeenCalledTimes(2);
    });

    it('no falla si el timer no expone unref', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.spyOn(globalThis, 'setInterval').mockReturnValue(
        {} as ReturnType<typeof setInterval>,
      );
      vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => {});

      expect(() => worker.onModuleInit()).not.toThrow();
    });
  });

  describe('tick', () => {
    it('evita ejecuciones concurrentes', async () => {
      let release: (value: never[]) => void = () => {};
      vi.mocked(repository.findSurveysClosingSoon!).mockReturnValue(
        new Promise((resolve) => {
          release = resolve;
        }),
      );
      vi.mocked(repository.findSurveysExpiredForClosure!).mockResolvedValue(
        [],
      );

      const first = worker.tick();
      await worker.tick();
      release([]);
      await first;

      expect(repository.findSurveysClosingSoon).toHaveBeenCalledTimes(1);
    });

    it('registra el error y libera el bloqueo si falla el ciclo', async () => {
      const loggerSpy = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      vi.mocked(repository.findSurveysClosingSoon!).mockRejectedValueOnce(
        new Error('db down'),
      );
      vi.mocked(repository.findSurveysExpiredForClosure!).mockResolvedValue(
        [],
      );

      await expect(worker.tick()).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        'Error procesando el ciclo de vida de encuestas',
        expect.stringContaining('db down'),
      );

      vi.mocked(repository.findSurveysClosingSoon!).mockResolvedValue([]);
      await worker.tick();
      expect(repository.findSurveysClosingSoon).toHaveBeenCalledTimes(2);
    });
  });

  it('continúa con las demás encuestas si falla una', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const buildSurvey = (id: string) => ({
      id,
      title: `Encuesta ${id}`,
      closesAt: new Date('2026-11-18T10:00:00Z'),
      createdById: `user-${id}`,
      _count: { responses: 1 },
    });
    vi.mocked(repository.findSurveysClosingSoon!).mockResolvedValue([
      buildSurvey('s-1'),
      buildSurvey('s-2'),
    ] as any);
    notificationsService.notify
      .mockRejectedValueOnce(new Error('notify down'))
      .mockResolvedValueOnce({ inAppCount: 1, pushStatus: 'sent', emailStatus: 'sent' });

    await worker.processClosingSoonSurveys(new Date('2026-11-15T10:00:00Z'));

    expect(notificationsService.notify).toHaveBeenCalledTimes(2);
    expect(repository.markClosingSoonNotified).toHaveBeenCalledTimes(1);
    expect(repository.markClosingSoonNotified).toHaveBeenCalledWith(
      's-2',
      expect.any(Date),
    );
  });

  it('normaliza questionIds antes de evaluar la variación', async () => {
    vi.mocked(repository.findSurveysExpiredForClosure!).mockResolvedValue([
      {
        id: 'survey-closed-2',
        title: 'Encuesta',
        closesAt: new Date('2026-11-14T23:59:59Z'),
        academicPeriod: 'II-2024',
        createdById: null,
        alertConfig: {
          isEnabled: true,
          threshold: 15,
          questionIds: ['q-1', 2, null, 'q-2'],
        },
        _count: { responses: 0 },
      },
      {
        id: 'survey-closed-3',
        title: 'Encuesta',
        closesAt: null,
        academicPeriod: null,
        createdById: null,
        alertConfig: { isEnabled: true, threshold: 10, questionIds: 'q-1' },
        _count: { responses: 0 },
      },
    ] as any);
    vi.mocked(variationEvaluator.evaluateSurvey!).mockResolvedValue({
      hasShifts: false,
      shifts: [],
      currentPeriod: '',
      previousPeriod: '',
      summaryText: '',
    });

    await worker.processClosedSurveys(new Date('2026-11-15T00:00:00Z'));

    expect(variationEvaluator.evaluateSurvey).toHaveBeenNthCalledWith(
      1,
      'survey-closed-2',
      expect.objectContaining({ questionIds: ['q-1', 'q-2'] }),
    );
    expect(variationEvaluator.evaluateSurvey).toHaveBeenNthCalledWith(
      2,
      'survey-closed-3',
      expect.objectContaining({ questionIds: null }),
    );
    expect(notificationsService.notify).not.toHaveBeenCalled();
  });

  it('debe notificar encuestas próximas a cerrar y marcarlas como notificadas', async () => {
    const mockSurvey = {
      id: 'survey-closing-1',
      title: 'Encuesta Egresados 2024',
      closesAt: new Date('2026-11-18T10:00:00Z'),
      createdById: 'user-1',
      _count: { responses: 42 },
    };

    vi.mocked(repository.findSurveysClosingSoon!).mockResolvedValue([
      mockSurvey as any,
    ]);

    await worker.processClosingSoonSurveys(new Date('2026-11-15T10:00:00Z'));

    expect(notificationsService.notify).toHaveBeenCalledTimes(1);
    expect(notificationsService.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientIds: ['user-1'],
        type: NotificationType.SURVEY_CLOSING_SOON,
        payload: expect.objectContaining({
          surveyTitle: 'Encuesta Egresados 2024',
        }),
      }),
    );
    expect(repository.markClosingSoonNotified).toHaveBeenCalledWith(
      'survey-closing-1',
      expect.any(Date),
    );
  });

  it('debe notificar encuestas cerradas y enviar alerta de variación si aplica', async () => {
    const mockSurvey = {
      id: 'survey-closed-1',
      title: 'Encuesta Inserción Laboral',
      closesAt: new Date('2026-11-14T23:59:59Z'),
      academicPeriod: 'II-2024',
      createdById: 'user-1',
      alertConfig: {
        isEnabled: true,
        threshold: 10,
        questionIds: null,
      },
      _count: { responses: 85 },
    };

    vi.mocked(repository.findSurveysExpiredForClosure!).mockResolvedValue([
      mockSurvey as any,
    ]);

    vi.mocked(variationEvaluator.evaluateSurvey!).mockResolvedValue({
      hasShifts: true,
      shifts: [
        {
          questionId: 'q-1',
          questionStatement: 'Pregunta 1',
          optionId: 'opt-1',
          optionLabel: 'Opción 1',
          currentPercentage: 60,
          previousPercentage: 40,
          difference: 20,
          direction: 'up',
        },
      ],
      currentPeriod: 'II-2024',
      previousPeriod: 'I-2024',
      summaryText: 'Variación detectada: Opción 1 +20 pp',
    });

    await worker.processClosedSurveys(new Date('2026-11-15T00:00:00Z'));

    // Should notify 2 times: 1 for closure, 1 for variation alert
    expect(notificationsService.notify).toHaveBeenCalledTimes(2);

    expect(notificationsService.notify).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        recipientIds: ['user-1'],
        type: NotificationType.SURVEY_CLOSED,
        payload: expect.objectContaining({
          surveyTitle: 'Encuesta Inserción Laboral',
        }),
      }),
    );

    expect(notificationsService.notify).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        recipientIds: ['user-1'],
        type: NotificationType.SURVEY_VARIATION_ALERT,
        payload: expect.objectContaining({
          surveyTitle: 'Encuesta Inserción Laboral',
          summaryText: 'Variación detectada: Opción 1 +20 pp',
        }),
      }),
    );

    expect(repository.markClosedNotified).toHaveBeenCalledWith(
      'survey-closed-1',
      expect.any(Date),
    );
  });
});
