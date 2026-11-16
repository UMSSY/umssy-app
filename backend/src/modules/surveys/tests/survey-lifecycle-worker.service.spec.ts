import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { SurveyLifecycleWorkerService } from '../services/survey-lifecycle-worker.service.js';
import type { SurveysRepository } from '../repositories/surveys.repository.js';
import type { SurveyVariationEvaluatorService } from '../services/survey-variation-evaluator.service.js';
import type { MailService } from '../../mail/services/mail.service.js';
import { getSemesterRange } from '../utils/academic-semester.js';

describe('SurveyLifecycleWorkerService', () => {
  let worker: SurveyLifecycleWorkerService;
  let repository: Partial<SurveysRepository>;
  let variationEvaluator: Partial<SurveyVariationEvaluatorService>;
  let mailService: Partial<MailService>;

  beforeEach(() => {
    repository = {
      findSurveysClosingSoon: vi.fn(),
      findSurveysExpiredForClosure: vi.fn(),
      findSurveysForVariationEvaluation: vi.fn().mockResolvedValue([]),
      markClosingSoonNotified: vi.fn(),
      markClosedNotified: vi.fn(),
    };
    variationEvaluator = {
      evaluateSurvey: vi.fn(),
    };
    mailService = {
      send: vi.fn(),
    };
    worker = new SurveyLifecycleWorkerService(
      repository as SurveysRepository,
      variationEvaluator as SurveyVariationEvaluatorService,
      mailService as MailService,
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

    it('revisa también las variaciones cuando empieza un semestre', async () => {
      vi.mocked(repository.findSurveysClosingSoon!).mockResolvedValue([]);
      vi.mocked(repository.findSurveysExpiredForClosure!).mockResolvedValue(
        [],
      );

      await worker.tick(new Date('2026-07-01T15:00:00Z'));

      expect(
        repository.findSurveysForVariationEvaluation,
      ).toHaveBeenCalledTimes(1);
    });
  });

  it('continúa con las demás encuestas si falla una', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const buildSurvey = (id: string, email: string) => ({
      id,
      title: `Encuesta ${id}`,
      closesAt: new Date('2026-11-18T10:00:00Z'),
      createdBy: { id: 'user-1', firstName: 'Ana', lastName: 'Gómez', email },
      _count: { responses: 1 },
    });
    vi.mocked(repository.findSurveysClosingSoon!).mockResolvedValue([
      buildSurvey('s-1', 'fail@umss.edu'),
      buildSurvey('s-2', 'ok@umss.edu'),
    ] as any);
    vi.mocked(mailService.send!)
      .mockRejectedValueOnce(new Error('smtp down'))
      .mockResolvedValueOnce(undefined);

    await worker.processClosingSoonSurveys(new Date('2026-11-15T10:00:00Z'));

    expect(mailService.send).toHaveBeenCalledTimes(2);
    expect(repository.markClosingSoonNotified).toHaveBeenCalledTimes(1);
    expect(repository.markClosingSoonNotified).toHaveBeenCalledWith(
      's-2',
      expect.any(Date),
    );
  });

  it('debe notificar encuestas próximas a cerrar y marcarlas como notificadas', async () => {
    const mockSurvey = {
      id: 'survey-closing-1',
      title: 'Encuesta Egresados 2024',
      closesAt: new Date('2026-11-18T10:00:00Z'),
      createdBy: {
        id: 'user-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@umss.edu',
      },
      _count: { responses: 42 },
    };

    vi.mocked(repository.findSurveysClosingSoon!).mockResolvedValue([
      mockSurvey as any,
    ]);

    await worker.processClosingSoonSurveys(new Date('2026-11-15T10:00:00Z'));

    expect(mailService.send).toHaveBeenCalledTimes(1);
    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'juan.perez@umss.edu',
        subject: 'La encuesta «Encuesta Egresados 2024» cierra en 3 días',
      }),
    );
    expect(repository.markClosingSoonNotified).toHaveBeenCalledWith(
      'survey-closing-1',
      expect.any(Date),
    );
  });

  it('debe notificar encuestas cerradas sin evaluar variaciones, que se revisan al terminar el semestre', async () => {
    const mockSurvey = {
      id: 'survey-closed-1',
      title: 'Encuesta Inserción Laboral',
      closesAt: new Date('2026-11-14T23:59:59Z'),
      academicPeriod: '2020',
      createdBy: {
        id: 'user-1',
        firstName: 'Ana',
        lastName: 'Gómez',
        email: 'ana.gomez@umss.edu',
      },
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

    await worker.processClosedSurveys(new Date('2026-11-15T00:00:00Z'));

    expect(mailService.send).toHaveBeenCalledTimes(1);
    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana.gomez@umss.edu',
        subject: 'La encuesta «Encuesta Inserción Laboral» ya cerró',
      }),
    );
    expect(variationEvaluator.evaluateSurvey).not.toHaveBeenCalled();
    expect(repository.markClosedNotified).toHaveBeenCalledWith(
      'survey-closed-1',
      expect.any(Date),
    );
  });

  describe('processSemesterVariations', () => {
    const SHIFTS = {
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
          direction: 'up' as const,
        },
      ],
      currentPeriod: 'I-2026',
      previousPeriod: 'II-2025',
      summaryText: 'Variación detectada: Opción 1 +20 pp',
    };
    const NO_SHIFTS = {
      hasShifts: false,
      shifts: [],
      currentPeriod: 'I-2026',
      previousPeriod: 'II-2025',
      summaryText: '',
    };

    function buildSurvey(overrides: Record<string, unknown> = {}) {
      return {
        id: 'survey-1',
        title: 'Encuesta Inserción Laboral',
        createdBy: {
          id: 'user-1',
          firstName: 'Ana',
          lastName: 'Gómez',
          email: 'ana.gomez@umss.edu',
        },
        alertConfig: { isEnabled: true, threshold: 15, questionIds: ['q-1'] },
        ...overrides,
      } as any;
    }

    const JULY_1 = new Date('2026-07-01T15:00:00Z');

    it('evalúa el semestre que acaba de terminar el 1 de julio, en hora de Bolivia', async () => {
      await worker.processSemesterVariations(new Date('2026-07-01T04:30:00Z'));

      expect(
        repository.findSurveysForVariationEvaluation,
      ).toHaveBeenCalledWith(getSemesterRange('I-2026'));
    });

    it('evalúa el segundo semestre del año anterior el 1 de enero', async () => {
      await worker.processSemesterVariations(new Date('2027-01-01T04:30:00Z'));

      expect(
        repository.findSurveysForVariationEvaluation,
      ).toHaveBeenCalledWith(getSemesterRange('II-2026'));
    });

    it.each([
      '2026-07-01T03:30:00Z',
      '2026-07-02T15:00:00Z',
      '2026-11-16T15:00:00Z',
      '2026-02-01T15:00:00Z',
    ])('no evalúa nada en un día que no es inicio de semestre (%s)', async (iso) => {
      await worker.processSemesterVariations(new Date(iso));

      expect(
        repository.findSurveysForVariationEvaluation,
      ).not.toHaveBeenCalled();
      expect(variationEvaluator.evaluateSurvey).not.toHaveBeenCalled();
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('evalúa con el umbral y las preguntas configurados', async () => {
      vi.mocked(repository.findSurveysForVariationEvaluation!).mockResolvedValue(
        [buildSurvey({ alertConfig: { isEnabled: true, threshold: 15, questionIds: ['q-1', 2, null, 'q-2'] } })],
      );
      vi.mocked(variationEvaluator.evaluateSurvey!).mockResolvedValue(NO_SHIFTS);

      await worker.processSemesterVariations(JULY_1);

      expect(variationEvaluator.evaluateSurvey).toHaveBeenCalledWith(
        'survey-1',
        { academicPeriod: 'I-2026', threshold: 15, questionIds: ['q-1', 'q-2'] },
      );
    });

    it('usa todas las preguntas cuando la encuesta no tiene configuración', async () => {
      vi.mocked(repository.findSurveysForVariationEvaluation!).mockResolvedValue(
        [buildSurvey({ alertConfig: null })],
      );
      vi.mocked(variationEvaluator.evaluateSurvey!).mockResolvedValue(NO_SHIFTS);

      await worker.processSemesterVariations(JULY_1);

      expect(variationEvaluator.evaluateSurvey).toHaveBeenCalledWith(
        'survey-1',
        { academicPeriod: 'I-2026', threshold: undefined, questionIds: null },
      );
    });

    it('envía un solo correo al creador con las variaciones', async () => {
      vi.mocked(repository.findSurveysForVariationEvaluation!).mockResolvedValue(
        [buildSurvey()],
      );
      vi.mocked(variationEvaluator.evaluateSurvey!).mockResolvedValue(SHIFTS);

      await worker.processSemesterVariations(JULY_1);

      expect(mailService.send).toHaveBeenCalledTimes(1);
      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ana.gomez@umss.edu',
          subject:
            'Alerta de variación significativa en «Encuesta Inserción Laboral»',
          mjml: expect.stringContaining('Opción 1'),
          values: expect.objectContaining({
            threshold: '15',
            periodsLabel: 'Comparación entre II-2025 y I-2026',
          }),
        }),
      );
    });

    it('no repite el correo en las siguientes revisiones del mismo día', async () => {
      vi.mocked(repository.findSurveysForVariationEvaluation!).mockResolvedValue(
        [buildSurvey()],
      );
      vi.mocked(variationEvaluator.evaluateSurvey!).mockResolvedValue(SHIFTS);

      await worker.processSemesterVariations(JULY_1);
      await worker.processSemesterVariations(new Date('2026-07-01T15:00:30Z'));
      await worker.processSemesterVariations(new Date('2026-07-01T22:00:00Z'));

      expect(variationEvaluator.evaluateSurvey).toHaveBeenCalledTimes(1);
      expect(mailService.send).toHaveBeenCalledTimes(1);
    });

    it('vuelve a avisar en el semestre siguiente aunque el servidor siga encendido', async () => {
      vi.mocked(repository.findSurveysForVariationEvaluation!).mockResolvedValue(
        [buildSurvey()],
      );
      vi.mocked(variationEvaluator.evaluateSurvey!).mockResolvedValue(SHIFTS);

      await worker.processSemesterVariations(JULY_1);
      await worker.processSemesterVariations(new Date('2027-01-01T15:00:00Z'));

      expect(mailService.send).toHaveBeenCalledTimes(2);
    });

    it('no envía correo cuando ninguna variación supera el umbral', async () => {
      vi.mocked(repository.findSurveysForVariationEvaluation!).mockResolvedValue(
        [buildSurvey()],
      );
      vi.mocked(variationEvaluator.evaluateSurvey!).mockResolvedValue(NO_SHIFTS);

      await worker.processSemesterVariations(JULY_1);

      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('no envía correo cuando la encuesta no tiene creador con correo', async () => {
      vi.mocked(repository.findSurveysForVariationEvaluation!).mockResolvedValue(
        [buildSurvey({ createdBy: null })],
      );
      vi.mocked(variationEvaluator.evaluateSurvey!).mockResolvedValue(SHIFTS);

      await worker.processSemesterVariations(JULY_1);

      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('reintenta en la siguiente revisión si falló el envío y continúa con las demás encuestas', async () => {
      vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      vi.mocked(repository.findSurveysForVariationEvaluation!).mockResolvedValue(
        [buildSurvey({ id: 'survey-1' }), buildSurvey({ id: 'survey-2' })],
      );
      vi.mocked(variationEvaluator.evaluateSurvey!).mockResolvedValue(SHIFTS);
      vi.mocked(mailService.send!)
        .mockRejectedValueOnce(new Error('smtp down'))
        .mockResolvedValue(undefined);

      await worker.processSemesterVariations(JULY_1);
      expect(mailService.send).toHaveBeenCalledTimes(2);

      await worker.processSemesterVariations(new Date('2026-07-01T15:00:30Z'));
      // survey-1 se reintenta y survey-2 ya no se repite
      expect(mailService.send).toHaveBeenCalledTimes(3);
    });

    it('no hace nada cuando no hay encuestas con alertas activas', async () => {
      await worker.processSemesterVariations(JULY_1);

      expect(variationEvaluator.evaluateSurvey).not.toHaveBeenCalled();
      expect(mailService.send).not.toHaveBeenCalled();
    });
  });
});
