import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  CAREER_SELECT,
  SURVEY_CREATED_SELECT,
  SURVEY_SUMMARY_SELECT,
} from '../constants/survey.constants.js';
import { SurveysStorageUnavailableException } from '../exceptions/surveys-storage-unavailable.exception.js';
import { CareersRepository } from '../repositories/careers.repository.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import type { CreateSurveyData } from '../types/create-survey-data.type.js';

const UUID_PATTERN = /^[0-9a-f-]{36}$/;

function createPrisma() {
  const tx = {
    survey: { create: vi.fn().mockResolvedValue({ id: 'survey-1' }) },
    surveyQuestion: { createMany: vi.fn() },
    surveyQuestionOption: { createMany: vi.fn() },
  };
  return {
    tx,
    survey: { findFirst: vi.fn(), findMany: vi.fn() },
    career: { findMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn((operation: (client: typeof tx) => unknown) =>
      operation(tx),
    ),
  };
}

const BASE_DATA: CreateSurveyData = {
  title: 'Encuesta',
  description: null,
  careerId: 'career-1',
  academicPeriod: 'II-2026',
  opensAt: null,
  closesAt: null,
  status: 'PUBLISHED',
  createdById: 'admin-1',
  questions: [],
};

describe('SurveysRepository', () => {
  let prisma: ReturnType<typeof createPrisma>;
  let repository: SurveysRepository;

  beforeEach(() => {
    prisma = createPrisma();
    repository = new SurveysRepository(prisma as unknown as PrismaService);
  });

  it('busca títulos repetidos sin distinguir mayúsculas dentro de la misma carrera y gestión', async () => {
    prisma.survey.findFirst
      .mockResolvedValueOnce({ id: 'survey-1' })
      .mockResolvedValueOnce(null);
    const scope = {
      title: 'Encuesta',
      careerId: 'career-1',
      academicPeriod: 'II-2026',
    };

    expect(await repository.existsWithTitle(scope)).toBe(true);
    expect(await repository.existsWithTitle(scope)).toBe(false);
    expect(prisma.survey.findFirst).toHaveBeenCalledWith({
      where: {
        title: { equals: 'Encuesta', mode: 'insensitive' },
        careerId: 'career-1',
        academicPeriod: 'II-2026',
      },
      select: { id: true },
    });
  });

  it('crea la encuesta, sus preguntas y opciones en una sola transacción y sin consultas por fila', async () => {
    await repository.create({
      ...BASE_DATA,
      questions: [
        {
          statement: 'Primera',
          type: 'SINGLE_CHOICE',
          isRequired: true,
          options: [{ label: 'Sí' }, { label: 'No' }],
        },
        {
          statement: 'Segunda',
          type: 'MULTIPLE_CHOICE',
          isRequired: false,
          options: [{ label: 'A' }, { label: 'B' }, { label: 'C' }],
        },
      ],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.tx.survey.create).toHaveBeenCalledWith({
      data: {
        title: 'Encuesta',
        description: null,
        careerId: 'career-1',
        academicPeriod: 'II-2026',
        opensAt: null,
        closesAt: null,
        status: 'PUBLISHED',
        createdById: 'admin-1',
      },
      select: SURVEY_CREATED_SELECT,
    });

    const [{ data: questions }] =
      prisma.tx.surveyQuestion.createMany.mock.calls[0];
    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({
      surveyId: 'survey-1',
      position: 1,
      statement: 'Primera',
      type: 'SINGLE_CHOICE',
      isRequired: true,
    });
    expect(questions[1]).toMatchObject({
      position: 2,
      type: 'MULTIPLE_CHOICE',
      isRequired: false,
    });
    expect(questions[0].id).toMatch(UUID_PATTERN);

    const [{ data: options }] =
      prisma.tx.surveyQuestionOption.createMany.mock.calls[0];
    expect(options).toHaveLength(5);
    expect(options[0]).toEqual({
      questionId: questions[0].id,
      position: 1,
      label: 'Sí',
    });
    expect(options[4]).toEqual({
      questionId: questions[1].id,
      position: 3,
      label: 'C',
    });
    expect(prisma.tx.surveyQuestion.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.tx.surveyQuestionOption.createMany).toHaveBeenCalledTimes(1);
  });

  it('omite la inserción de preguntas y opciones cuando el borrador no tiene', async () => {
    const created = await repository.create(BASE_DATA);

    expect(created).toEqual({ id: 'survey-1' });
    expect(prisma.tx.surveyQuestion.createMany).not.toHaveBeenCalled();
    expect(prisma.tx.surveyQuestionOption.createMany).not.toHaveBeenCalled();
  });

  it('omite la inserción de opciones si ninguna pregunta tiene', async () => {
    await repository.create({
      ...BASE_DATA,
      questions: [
        { statement: '', type: 'SINGLE_CHOICE', isRequired: true, options: [] },
      ],
    });

    expect(prisma.tx.surveyQuestion.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.tx.surveyQuestionOption.createMany).not.toHaveBeenCalled();
  });

  it('lista las encuestas de la más reciente a la más antigua', async () => {
    prisma.survey.findMany.mockResolvedValue([]);

    await repository.findAll();

    expect(prisma.survey.findMany).toHaveBeenCalledWith({
      select: SURVEY_SUMMARY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('CareersRepository', () => {
  let prisma: ReturnType<typeof createPrisma>;
  let repository: CareersRepository;

  beforeEach(() => {
    prisma = createPrisma();
    repository = new CareersRepository(prisma as unknown as PrismaService);
  });

  it('lista las carreras ordenadas por título', async () => {
    prisma.career.findMany.mockResolvedValue([
      { id: 'career-1', title: 'Sistemas' },
    ]);

    expect(await repository.findAll()).toEqual([
      { id: 'career-1', title: 'Sistemas' },
    ]);
    expect(prisma.career.findMany).toHaveBeenCalledWith({
      select: CAREER_SELECT,
      orderBy: { title: 'asc' },
    });
  });

  it('indica si la carrera existe', async () => {
    prisma.career.findUnique
      .mockResolvedValueOnce({ id: 'career-1' })
      .mockResolvedValueOnce(null);

    expect(await repository.exists('career-1')).toBe(true);
    expect(await repository.exists('missing')).toBe(false);
    expect(prisma.career.findUnique).toHaveBeenCalledWith({
      where: { id: 'career-1' },
      select: { id: true },
    });
  });
});

describe('SurveysRepository sin modelos de encuestas en Prisma', () => {
  it('responde que el registro de encuestas no está disponible', async () => {
    const repository = new SurveysRepository({} as PrismaService);

    await expect(repository.findAll()).rejects.toBeInstanceOf(
      SurveysStorageUnavailableException,
    );
    await expect(
      repository.existsWithTitle({
        title: 'Encuesta',
        careerId: null,
        academicPeriod: null,
      }),
    ).rejects.toMatchObject({ statusCode: 503 });
  });
});
