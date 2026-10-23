import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';
import {
  CareerNotFoundException,
  InvalidSurveyScheduleException,
  SurveyTitleAlreadyExistsException,
} from '../exceptions/index.js';
import { SurveyMapper } from '../mappers/survey.mapper.js';
import type { CareersRepository } from '../repositories/careers.repository.js';
import type { SurveysRepository } from '../repositories/surveys.repository.js';
import type { CreateSurveyRequest } from '../requests/create-survey.schema.js';
import { SurveysService } from '../services/surveys.service.js';

const NOW = new Date('2026-10-22T15:00:00.000Z');
const CAREER_ID = '6f1c2f4e-7c0a-4c55-9d7e-1a2b3c4d5e6f';

const PUBLISHED_REQUEST: CreateSurveyRequest = {
  title: 'Encuesta de Empleabilidad',
  description: 'Situación laboral',
  careerId: CAREER_ID,
  academicPeriod: 'II-2026',
  opensAt: '2026-11-03T04:00:00.000Z',
  closesAt: '2026-12-16T03:59:59.999Z',
  status: 'published',
  questions: [
    {
      statement: '¿Trabajas actualmente?',
      type: 'single_choice',
      isRequired: true,
      options: [{ label: 'Sí' }, { label: 'No' }],
    },
  ],
};

function createRepositories() {
  return {
    surveys: {
      existsWithTitle: vi.fn().mockResolvedValue(false),
      create: vi.fn().mockResolvedValue({
        id: 'survey-1',
        title: PUBLISHED_REQUEST.title,
        status: 'PUBLISHED',
        createdAt: NOW,
      }),
      findAll: vi.fn(),
    },
    careers: { exists: vi.fn().mockResolvedValue(true), findAll: vi.fn() },
  };
}

describe('SurveysService', () => {
  let repositories: ReturnType<typeof createRepositories>;
  let service: SurveysService;

  beforeEach(() => {
    repositories = createRepositories();
    service = new SurveysService(
      repositories.surveys as unknown as SurveysRepository,
      repositories.careers as unknown as CareersRepository,
      new SurveyMapper(),
    );
  });

  it('publica una encuesta válida y guarda al creador', async () => {
    const result = await service.create('admin-1', PUBLISHED_REQUEST, NOW);

    expect(result).toEqual({
      id: 'survey-1',
      title: PUBLISHED_REQUEST.title,
      status: 'published',
      createdAt: NOW.toISOString(),
    });
    expect(repositories.careers.exists).toHaveBeenCalledWith(CAREER_ID);
    expect(repositories.surveys.existsWithTitle).toHaveBeenCalledWith({
      title: PUBLISHED_REQUEST.title,
      careerId: CAREER_ID,
      academicPeriod: 'II-2026',
    });
    expect(repositories.surveys.create).toHaveBeenCalledWith(
      expect.objectContaining({
        createdById: 'admin-1',
        status: 'PUBLISHED',
        opensAt: new Date('2026-11-03T04:00:00.000Z'),
        questions: [
          {
            statement: '¿Trabajas actualmente?',
            type: 'SINGLE_CHOICE',
            isRequired: true,
            options: [{ label: 'Sí' }, { label: 'No' }],
          },
        ],
      }),
    );
  });

  it('guarda un borrador con solo el título sin validar carrera ni fechas', async () => {
    repositories.surveys.create.mockResolvedValue({
      id: 'survey-2',
      title: 'Borrador',
      status: 'DRAFT',
      createdAt: NOW,
    });

    const result = await service.create('admin-1', { title: 'Borrador', status: 'draft', questions: [] }, NOW);

    expect(result.status).toBe('draft');
    expect(repositories.careers.exists).not.toHaveBeenCalled();
    expect(repositories.surveys.existsWithTitle).toHaveBeenCalledWith({
      title: 'Borrador',
      careerId: null,
      academicPeriod: null,
    });
    expect(repositories.surveys.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'DRAFT', careerId: null, opensAt: null, closesAt: null }),
    );
  });

  it('no valida la vigencia de un borrador', async () => {
    await expect(
      service.create(
        'admin-1',
        { ...PUBLISHED_REQUEST, status: 'draft', opensAt: '2026-01-01T04:00:00.000Z' },
        NOW,
      ),
    ).resolves.toBeDefined();
  });

  it('rechaza una carrera inexistente con 404', async () => {
    repositories.careers.exists.mockResolvedValue(false);

    await expect(service.create('admin-1', PUBLISHED_REQUEST, NOW)).rejects.toBeInstanceOf(
      CareerNotFoundException,
    );
    expect(repositories.surveys.create).not.toHaveBeenCalled();
  });

  it('rechaza un título duplicado para la misma carrera y gestión con 409', async () => {
    repositories.surveys.existsWithTitle.mockResolvedValue(true);

    const error = await service.create('admin-1', PUBLISHED_REQUEST, NOW).catch((caught) => caught);

    expect(error).toBeInstanceOf(SurveyTitleAlreadyExistsException);
    expect(error).toMatchObject({ statusCode: 409, message: SURVEY_ERROR_MESSAGES.TITLE_ALREADY_EXISTS });
    expect(repositories.surveys.create).not.toHaveBeenCalled();
  });

  it('rechaza un título duplicado también al guardar un borrador', async () => {
    repositories.surveys.existsWithTitle.mockResolvedValue(true);

    await expect(
      service.create('admin-1', { title: 'Borrador', status: 'draft', questions: [] }, NOW),
    ).rejects.toBeInstanceOf(SurveyTitleAlreadyExistsException);
  });

  it('rechaza una fecha de cierre igual a la de apertura', async () => {
    const error = await service
      .create('admin-1', { ...PUBLISHED_REQUEST, closesAt: '2026-11-04T03:00:00.000Z' }, NOW)
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(InvalidSurveyScheduleException);
    expect(error).toMatchObject({
      statusCode: 400,
      message: SURVEY_ERROR_MESSAGES.CLOSES_BEFORE_OPENS,
      data: { field: 'closesAt' },
    });
  });

  it('rechaza una fecha de apertura anterior a hoy en Bolivia', async () => {
    const error = await service
      .create('admin-1', { ...PUBLISHED_REQUEST, opensAt: '2026-10-21T04:00:00.000Z' }, NOW)
      .catch((caught) => caught);

    expect(error).toMatchObject({
      statusCode: 400,
      message: SURVEY_ERROR_MESSAGES.OPENS_IN_THE_PAST,
      data: { field: 'opensAt' },
    });
  });

  it('acepta una apertura el mismo día de hoy en Bolivia', async () => {
    await expect(
      service.create('admin-1', { ...PUBLISHED_REQUEST, opensAt: '2026-10-22T04:00:00.000Z' }, NOW),
    ).resolves.toBeDefined();
  });

  it('usa la fecha actual cuando no recibe una referencia', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    await expect(service.create('admin-1', PUBLISHED_REQUEST)).resolves.toBeDefined();

    vi.useRealTimers();
  });

  it('lista las encuestas con su carrera y número de preguntas', async () => {
    repositories.surveys.findAll.mockResolvedValue([
      {
        id: 'survey-1',
        title: 'Encuesta',
        status: 'PUBLISHED',
        academicPeriod: 'II-2026',
        opensAt: NOW,
        closesAt: NOW,
        createdAt: NOW,
        career: { id: CAREER_ID, title: 'Ingeniería de Sistemas' },
        _count: { questions: 4 },
      },
    ]);

    const result = await service.listSurveys();

    expect(result).toEqual([
      {
        id: 'survey-1',
        title: 'Encuesta',
        status: 'published',
        career: { id: CAREER_ID, title: 'Ingeniería de Sistemas' },
        academicPeriod: 'II-2026',
        opensAt: NOW.toISOString(),
        closesAt: NOW.toISOString(),
        questionCount: 4,
        createdAt: NOW.toISOString(),
      },
    ]);
  });
});
