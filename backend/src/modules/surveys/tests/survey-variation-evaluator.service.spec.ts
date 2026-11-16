import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SurveyVariationEvaluatorService } from '../services/survey-variation-evaluator.service.js';
import type { SurveysRepository } from '../repositories/surveys.repository.js';

describe('SurveyVariationEvaluatorService', () => {
  let service: SurveyVariationEvaluatorService;
  let repository: Partial<SurveysRepository>;

  const mockSurveyId = 'survey-123';

  beforeEach(() => {
    repository = {
      findAlertConfig: vi.fn(),
      findStatistics: vi.fn(),
    };
    service = new SurveyVariationEvaluatorService(
      repository as SurveysRepository,
    );
  });

  it('debe retornar hasShifts=false si las alertas están deshabilitadas', async () => {
    vi.mocked(repository.findAlertConfig!).mockResolvedValue({
      id: 'cfg-1',
      surveyId: mockSurveyId,
      isEnabled: false,
      threshold: 10,
      questionIds: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.evaluateSurvey(mockSurveyId);
    expect(result.hasShifts).toBe(false);
    expect(result.shifts).toHaveLength(0);
  });

  it('debe omitir evaluación si no hay respuestas en el semestre actual o anterior', async () => {
    vi.mocked(repository.findAlertConfig!).mockResolvedValue({
      id: 'cfg-1',
      surveyId: mockSurveyId,
      isEnabled: true,
      threshold: 10,
      questionIds: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Current has 0 responses
    vi.mocked(repository.findStatistics!).mockResolvedValueOnce({
      _count: { responses: 0 },
      questions: [],
    } as any);
    // Previous has 10 responses
    vi.mocked(repository.findStatistics!).mockResolvedValueOnce({
      _count: { responses: 10 },
      questions: [],
    } as any);

    const result = await service.evaluateSurvey(mockSurveyId, {
      academicPeriod: 'II-2024',
    });

    expect(result.hasShifts).toBe(false);
    expect(result.shifts).toHaveLength(0);
  });

  it('debe detectar una variación significativa que supere el umbral', async () => {
    vi.mocked(repository.findAlertConfig!).mockResolvedValue({
      id: 'cfg-1',
      surveyId: mockSurveyId,
      isEnabled: true,
      threshold: 10,
      questionIds: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Current: Option A: 70 answers (70%), Option B: 30 answers (30%)
    vi.mocked(repository.findStatistics!).mockResolvedValueOnce({
      _count: { responses: 100 },
      questions: [
        {
          id: 'q-1',
          statement: '¿Cuál es tu situación laboral?',
          options: [
            { id: 'opt-1', label: 'Empleado', _count: { answers: 70 } },
            { id: 'opt-2', label: 'Buscando empleo', _count: { answers: 30 } },
          ],
        },
      ],
    } as any);

    // Previous: Option A: 50 answers (50%), Option B: 50 answers (50%)
    // Diff for Empleado: 70 - 50 = +20 pp (>= 10 threshold) -> shift!
    // Diff for Buscando: 30 - 50 = -20 pp (>= 10 threshold) -> shift!
    vi.mocked(repository.findStatistics!).mockResolvedValueOnce({
      _count: { responses: 100 },
      questions: [
        {
          id: 'q-1',
          statement: '¿Cuál es tu situación laboral?',
          options: [
            { id: 'opt-1', label: 'Empleado', _count: { answers: 50 } },
            { id: 'opt-2', label: 'Buscando empleo', _count: { answers: 50 } },
          ],
        },
      ],
    } as any);

    const result = await service.evaluateSurvey(mockSurveyId, {
      academicPeriod: 'II-2024',
      threshold: 10,
    });

    expect(result.hasShifts).toBe(true);
    expect(result.shifts).toHaveLength(2);
    expect(result.shifts[0]).toMatchObject({
      questionId: 'q-1',
      optionLabel: 'Empleado',
      currentPercentage: 70,
      previousPercentage: 50,
      difference: 20,
      direction: 'up',
    });
    expect(result.shifts[1]).toMatchObject({
      questionId: 'q-1',
      optionLabel: 'Buscando empleo',
      currentPercentage: 30,
      previousPercentage: 50,
      difference: -20,
      direction: 'down',
    });
    expect(result.summaryText).toContain('Empleado');
    expect(result.summaryText).toContain('+20 pp');
  });

  it.each([
    [60, 40, false],
    [61, 39, true],
  ])(
    'debe avisar solo cuando la variación supera el umbral: %i%% frente a 50%% con umbral de 10 puntos',
    async (employed, searching, expectedShifts) => {
      vi.mocked(repository.findAlertConfig!).mockResolvedValue({
        id: 'cfg-1',
        surveyId: mockSurveyId,
        isEnabled: true,
        threshold: 10,
        questionIds: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const statistics = (first: number, second: number) =>
        ({
          _count: { responses: 100 },
          questions: [
            {
              id: 'q-1',
              statement: '¿Cuál es tu situación laboral?',
              options: [
                { id: 'opt-1', label: 'Empleado', _count: { answers: first } },
                {
                  id: 'opt-2',
                  label: 'Buscando empleo',
                  _count: { answers: second },
                },
              ],
            },
          ],
        }) as any;
      vi.mocked(repository.findStatistics!).mockResolvedValueOnce(
        statistics(employed, searching),
      );
      vi.mocked(repository.findStatistics!).mockResolvedValueOnce(
        statistics(50, 50),
      );

      const result = await service.evaluateSurvey(mockSurveyId, {
        academicPeriod: 'II-2024',
        threshold: 10,
      });

      expect(result.hasShifts).toBe(expectedShifts);
    },
  );

  it.each(['2020', 'Todas'])(
    'debe evaluar con la fecha de cierre cuando la gestión de la encuesta es "%s" y no un semestre',
    async (academicPeriod) => {
      vi.mocked(repository.findAlertConfig!).mockResolvedValue({
        id: 'cfg-1',
        surveyId: mockSurveyId,
        isEnabled: true,
        threshold: 10,
        questionIds: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const statistics = (employed: number, searching: number) =>
        ({
          _count: { responses: 100 },
          questions: [
            {
              id: 'q-1',
              statement: '¿Cuál es tu situación laboral?',
              options: [
                { id: 'opt-1', label: 'Empleado', _count: { answers: employed } },
                {
                  id: 'opt-2',
                  label: 'Buscando empleo',
                  _count: { answers: searching },
                },
              ],
            },
          ],
        }) as any;
      vi.mocked(repository.findStatistics!).mockResolvedValueOnce(
        statistics(70, 30),
      );
      vi.mocked(repository.findStatistics!).mockResolvedValueOnce(
        statistics(50, 50),
      );

      const result = await service.evaluateSurvey(mockSurveyId, {
        academicPeriod,
        closesAt: new Date('2026-09-01T15:00:00.000Z'),
        threshold: 10,
      });

      expect(result.currentPeriod).toBe('II-2026');
      expect(result.previousPeriod).toBe('I-2026');
      expect(result.hasShifts).toBe(true);
      expect(result.shifts).toHaveLength(2);
    },
  );

  it('debe respetar el filtro de preguntas vigiladas (questionIds)', async () => {
    vi.mocked(repository.findAlertConfig!).mockResolvedValue({
      id: 'cfg-1',
      surveyId: mockSurveyId,
      isEnabled: true,
      threshold: 10,
      questionIds: ['q-1'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(repository.findStatistics!).mockResolvedValueOnce({
      _count: { responses: 100 },
      questions: [
        {
          id: 'q-1',
          statement: 'Pregunta 1',
          options: [
            { id: 'opt-1a', label: 'Opción 1A', _count: { answers: 80 } },
            { id: 'opt-1b', label: 'Opción 1B', _count: { answers: 20 } },
          ],
        },
        {
          id: 'q-2',
          statement: 'Pregunta 2',
          options: [
            { id: 'opt-2a', label: 'Opción 2A', _count: { answers: 90 } },
            { id: 'opt-2b', label: 'Opción 2B', _count: { answers: 10 } },
          ],
        },
      ],
    } as any);

    vi.mocked(repository.findStatistics!).mockResolvedValueOnce({
      _count: { responses: 100 },
      questions: [
        {
          id: 'q-1',
          statement: 'Pregunta 1',
          options: [
            { id: 'opt-1a', label: 'Opción 1A', _count: { answers: 50 } },
            { id: 'opt-1b', label: 'Opción 1B', _count: { answers: 50 } },
          ],
        },
        {
          id: 'q-2',
          statement: 'Pregunta 2',
          options: [
            { id: 'opt-2a', label: 'Opción 2A', _count: { answers: 50 } },
            { id: 'opt-2b', label: 'Opción 2B', _count: { answers: 50 } },
          ],
        },
      ],
    } as any);

    const result = await service.evaluateSurvey(mockSurveyId, {
      academicPeriod: 'II-2024',
      questionIds: ['q-1'],
    });

    expect(result.hasShifts).toBe(true);
    // Only q-1 was monitored, so shifts only contains q-1
    expect(result.shifts.every((s) => s.questionId === 'q-1')).toBe(true);
  });
});
