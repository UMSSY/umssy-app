import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  EMPLOYMENT_STATUS_QUESTION,
  MONTHLY_SALARY_QUESTION,
  SURVEY_EMPLOYMENT_RESPONSE_SELECT,
} from '../constants/survey-employment.constants.js';
import { SurveyEmploymentResponsesRepository } from '../repositories/survey-employment-responses.repository.js';
import { SurveyEmploymentResponsesService } from '../services/survey-employment-responses.service.js';

function createService(records: unknown[] = []) {
  const findMany = vi.fn().mockResolvedValue(records);
  const repository = new SurveyEmploymentResponsesRepository({
    surveyResponse: { findMany },
  } as unknown as PrismaService);
  return { findMany, service: new SurveyEmploymentResponsesService(repository) };
}

describe('SurveyEmploymentResponsesService', () => {
  it('normaliza las respuestas de situación laboral y rango salarial', async () => {
    const submittedAt = new Date('2025-03-01T14:00:00.000Z');
    const { service } = createService([
      {
        respondentId: 'user-1',
        submittedAt,
        answers: [
          { question: { statement: MONTHLY_SALARY_QUESTION }, option: { label: 'Hasta Bs 3.000' } },
          { question: { statement: EMPLOYMENT_STATUS_QUESTION }, option: { label: 'Independiente' } },
        ],
      },
      { respondentId: 'user-2', submittedAt, answers: [{ question: { statement: EMPLOYMENT_STATUS_QUESTION }, option: null }] },
    ]);

    await expect(service.findEmploymentResponses({})).resolves.toEqual([
      { respondentId: 'user-1', submittedAt, employmentStatusLabel: 'Independiente', monthlySalaryLabel: 'Hasta Bs 3.000' },
      { respondentId: 'user-2', submittedAt, employmentStatusLabel: null, monthlySalaryLabel: null },
    ]);
  });

  it('filtra por rango de fechas y carrera aprobada del titulado activo', async () => {
    const { findMany, service } = createService();
    const from = new Date('2025-01-01T04:00:00.000Z');
    const to = new Date('2026-01-01T03:59:59.999Z');

    await service.findEmploymentResponses({ careerId: 'career-1', from, to });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        submittedAt: { gte: from, lte: to },
        answers: { some: { question: { statement: EMPLOYMENT_STATUS_QUESTION } } },
        respondent: { isActive: true, approvedAccessRequest: { is: { careerId: 'career-1' } } },
      },
      select: SURVEY_EMPLOYMENT_RESPONSE_SELECT,
    });
  });

  it('exige una solicitud aprobada cuando no se filtra por carrera', async () => {
    const { findMany, service } = createService();

    await service.findEmploymentResponses({});

    expect(findMany.mock.calls[0]?.[0].where).toMatchObject({
      submittedAt: undefined,
      respondent: { isActive: true, approvedAccessRequest: { isNot: null } },
    });
  });
});
