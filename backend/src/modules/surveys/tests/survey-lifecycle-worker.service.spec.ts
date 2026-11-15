import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SurveyLifecycleWorkerService } from '../services/survey-lifecycle-worker.service.js';
import type { SurveysRepository } from '../repositories/surveys.repository.js';
import type { SurveyVariationEvaluatorService } from '../services/survey-variation-evaluator.service.js';
import type { MailService } from '../../mail/services/mail.service.js';

describe('SurveyLifecycleWorkerService', () => {
  let worker: SurveyLifecycleWorkerService;
  let repository: Partial<SurveysRepository>;
  let variationEvaluator: Partial<SurveyVariationEvaluatorService>;
  let mailService: Partial<MailService>;

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
    mailService = {
      send: vi.fn(),
    };
    worker = new SurveyLifecycleWorkerService(
      repository as SurveysRepository,
      variationEvaluator as SurveyVariationEvaluatorService,
      mailService as MailService,
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

  it('debe notificar encuestas cerradas y enviar alerta de variación si aplica', async () => {
    const mockSurvey = {
      id: 'survey-closed-1',
      title: 'Encuesta Inserción Laboral',
      closesAt: new Date('2026-11-14T23:59:59Z'),
      academicPeriod: 'II-2024',
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

    // Should send 2 emails: 1 for closure, 1 for variation alert
    expect(mailService.send).toHaveBeenCalledTimes(2);

    expect(mailService.send).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: 'ana.gomez@umss.edu',
        subject: 'La encuesta «Encuesta Inserción Laboral» ya cerró',
      }),
    );

    expect(mailService.send).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: 'ana.gomez@umss.edu',
        subject:
          'Alerta de variación significativa en «Encuesta Inserción Laboral»',
      }),
    );

    expect(repository.markClosedNotified).toHaveBeenCalledWith(
      'survey-closed-1',
      expect.any(Date),
    );
  });
});
