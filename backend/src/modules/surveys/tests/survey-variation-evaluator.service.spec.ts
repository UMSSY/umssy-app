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
      closesAt: new Date('2024-11-15T12:00:00Z'),
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
      closesAt: new Date('2024-11-15T12:00:00Z'),
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
      closesAt: new Date('2024-11-15T12:00:00Z'),
      questionIds: ['q-1'],
    });

    expect(result.hasShifts).toBe(true);
    // Only q-1 was monitored, so shifts only contains q-1
    expect(result.shifts.every((s) => s.questionId === 'q-1')).toBe(true);
  });
  it('compara el semestre de cierre con el semestre anterior', async () => {
    vi.mocked(repository.findAlertConfig!).mockResolvedValue(null);
    vi.mocked(repository.findStatistics!).mockResolvedValue({
      _count: { responses: 0 },
      questions: [],
    } as any);

    const result = await service.evaluateSurvey(mockSurveyId, {
      closesAt: new Date('2024-11-15T12:00:00Z'),
    });

    expect(result.currentPeriod).toBe('II-2024');
    expect(result.previousPeriod).toBe('I-2024');
    expect(repository.findStatistics).toHaveBeenCalledTimes(2);
  });
});
