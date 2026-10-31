import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';
import {
  CareerNotFoundException,
  InvalidSurveyScheduleException,
  SurveyHasResponsesException,
  SurveyNotAvailableException,
  SurveyNotFoundException,
  SurveyNotOpenException,
  SurveyNotPublishedException,
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
  targetAudience: 'graduates',
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
        status: { title: 'published' },
        createdAt: NOW,
      }),
      findAll: vi.fn(),
      findGraduateProfile: vi.fn().mockResolvedValue({ careerId: CAREER_ID, graduationYear: 2026 }),
      findNotificationsForUser: vi.fn().mockResolvedValue([]),
      findByIdWithQuestions: vi.fn(),
      submitResponse: vi.fn(),
      findPublicationState: vi.fn(),
      unpublish: vi.fn().mockResolvedValue(true),
    },
    careers: { exists: vi.fn().mockResolvedValue(true), findAll: vi.fn() },
  };
}


describe('SurveysService', () => {
  let repositories: ReturnType<typeof createRepositories>;
  let pdfService: { generatePdf: ReturnType<typeof vi.fn> };
  let reportHistoryService: { registerGeneratedReport: ReturnType<typeof vi.fn> };
  let service: SurveysService;

  beforeEach(() => {
    repositories = createRepositories();
    pdfService = { generatePdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf')) };
    reportHistoryService = { registerGeneratedReport: vi.fn().mockResolvedValue({}) };
    service = new SurveysService(
      repositories.surveys as unknown as SurveysRepository,
      repositories.careers as unknown as CareersRepository,
      new SurveyMapper(),
      pdfService as never,
      reportHistoryService as never,
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
      excludedId: undefined,
      now: NOW,
    });
    expect(repositories.surveys.create).toHaveBeenCalledWith(
      expect.objectContaining({
        createdById: 'admin-1',
        status: 'published',
        opensAt: new Date('2026-11-03T04:00:00.000Z'),
        questions: [
          {
            statement: '¿Trabajas actualmente?',
            type: 'single_choice',
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
      status: { title: 'draft' },
      createdAt: NOW,
    });

    const result = await service.create('admin-1', { title: 'Borrador', status: 'draft', questions: [] }, NOW);

    expect(result.status).toBe('draft');
    expect(repositories.careers.exists).not.toHaveBeenCalled();
    expect(repositories.surveys.existsWithTitle).toHaveBeenCalledWith({
      title: 'Borrador',
      careerId: null,
      academicPeriod: null,
      excludedId: undefined,
      now: NOW,
    });
    expect(repositories.surveys.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft', careerId: null, opensAt: null, closesAt: null }),
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
      service.create(
        'admin-1',
        {
          title: 'Borrador',
          description: undefined,
          careerId: undefined,
          academicPeriod: undefined,
          opensAt: undefined,
          closesAt: undefined,
          status: 'draft',
          questions: [],
        },
        NOW,
      ),
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
        status: { title: 'published' },
        academicPeriod: 'II-2026',
        targetAudience: { title: 'graduates' },
        opensAt: NOW,
        closesAt: NOW,
        createdAt: NOW,
        career: { id: CAREER_ID, title: 'Ingeniería de Sistemas' },
        createdBy: { firstName: 'Admin', lastName: 'Uno', email: 'admin.1@umssy.test' },
        _count: { questions: 4, responses: 0 },
      },
    ]);

    const result = await service.listSurveys(NOW);

    expect(result).toEqual([
      {
        id: 'survey-1',
        title: 'Encuesta',
        status: 'published',
        career: { id: CAREER_ID, title: 'Ingeniería de Sistemas' },
        createdBy: { fullName: 'Admin Uno', email: 'admin.1@umssy.test' },
        academicPeriod: 'II-2026',
        targetAudience: 'graduates',
        opensAt: NOW.toISOString(),
        closesAt: NOW.toISOString(),
        questionCount: 4,
        responseCount: 0,
        createdAt: NOW.toISOString(),
      },
    ]);
  });

  it('exporta el PDF de la encuesta y registra la exportación en el historial', async () => {
    vi.spyOn(service, 'getStatistics').mockResolvedValue({
      id: 'survey-1',
      title: 'Encuesta IA',
      description: null,
      status: 'published',
      academicPeriod: '1-2026',
      career: { id: CAREER_ID, title: 'Informática' },
      opensAt: NOW.toISOString(),
      closesAt: NOW.toISOString(),
      totalResponses: 10,
      questions: [],
    });

    const result = await service.exportSurveyPdf('survey-1', 'admin-1');

    expect(pdfService.generatePdf).toHaveBeenCalled();
    expect(reportHistoryService.registerGeneratedReport).toHaveBeenCalledWith('admin-1', {
      fileName: expect.stringMatching(/^reporte-encuesta-encuesta-ia-\d{4}-\d{2}-\d{2}\.pdf$/),
      reportType: 'SURVEY_STATISTICS',
    });
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.fileName).toContain('reporte-encuesta-encuesta-ia');
  });

  it('obtiene las notificaciones de encuestas delegando en el repositorio', async () => {
    const mockNotifications = [
      {
        id: 's1',
        title: 'Encuesta 1',
        publishedAt: '2026-10-15T00:00:00.000Z',
        status: 'pending' as const,
      },
    ];
    const spy = repositories.surveys.findNotificationsForUser.mockResolvedValue(mockNotifications);

    const result = await service.getNotificationsForUser('user-1', ['titulado']);

    expect(spy).toHaveBeenCalledWith('user-1', { careerId: CAREER_ID, graduationYear: 2026 }, ['all', 'graduates']);
    expect(result).toBe(mockNotifications);
  });

  it('no consulta notificaciones si la sesión no tiene un rol destinatario', async () => {
    await expect(service.getNotificationsForUser('admin-1', ['administrativo'])).resolves.toEqual([]);
    expect(repositories.surveys.findNotificationsForUser).not.toHaveBeenCalled();
  });

  it('rechaza responder una encuesta dirigida a otro tipo de usuario', async () => {
    repositories.surveys.findByIdWithQuestions.mockResolvedValue({
      id: 's1',
      title: 'Test',
      status: 'published',
      targetAudience: 'mentors',
      questions: [],
    });

    await expect(service.getSurveyForAnswering('s1', 'user-1', ['titulado'])).rejects.toBeInstanceOf(
      SurveyNotAvailableException,
    );
    await expect(service.getSurveyForAnswering('s1', 'user-1', ['mentor'])).resolves.toBeDefined();
  });

  it('no permite responder una encuesta antes de su fecha de apertura', async () => {
    const survey = {
      id: 's1',
      title: 'Test',
      status: 'published',
      targetAudience: 'graduates',
      opensAt: '2999-01-01T04:00:00.000Z',
      isExpired: false,
      hasAnswered: false,
      questions: [],
    };
    repositories.surveys.findByIdWithQuestions.mockResolvedValue(survey);

    await expect(service.getSurveyForAnswering('s1', 'user-1', ['titulado'])).rejects.toBeInstanceOf(
      SurveyNotOpenException,
    );
    await expect(service.submitResponse('s1', 'user-1', { answers: [] }, ['titulado'])).rejects.toBeInstanceOf(
      SurveyNotOpenException,
    );
    expect(repositories.surveys.submitResponse).not.toHaveBeenCalled();
  });

  it('devuelve a borrador una encuesta publicada sin respuestas', async () => {
    repositories.surveys.findPublicationState.mockResolvedValue({ status: 'published', responseCount: 0 });

    await expect(service.unpublish('s1')).resolves.toBeUndefined();
    expect(repositories.surveys.unpublish).toHaveBeenCalledWith('s1');
  });

  it.each([
    ['no existe', null, SurveyNotFoundException],
    ['es un borrador', { status: 'draft', responseCount: 0 }, SurveyNotPublishedException],
    ['ya tiene respuestas', { status: 'published', responseCount: 3 }, SurveyHasResponsesException],
  ])('no inhabilita una encuesta que %s', async (_case, state, exception) => {
    repositories.surveys.findPublicationState.mockResolvedValue(state);

    await expect(service.unpublish('s1')).rejects.toBeInstanceOf(exception);
    expect(repositories.surveys.unpublish).not.toHaveBeenCalled();
  });

  it('no inhabilita la encuesta si recibe una respuesta antes de actualizarla', async () => {
    repositories.surveys.findPublicationState.mockResolvedValue({ status: 'published', responseCount: 0 });
    repositories.surveys.unpublish.mockResolvedValue(false);

    await expect(service.unpublish('s1')).rejects.toBeInstanceOf(SurveyHasResponsesException);
  });

  it('obtiene encuesta para responderla o lanza SurveyNotFoundException si no existe', async () => {
    repositories.surveys.findByIdWithQuestions.mockResolvedValue(null);
    await expect(service.getSurveyForAnswering('unknown', 'user-1')).rejects.toThrow(
      SurveyNotFoundException,
    );

    const mockDetail = { id: 's1', title: 'Test', status: 'published', targetAudience: 'graduates', questions: [] };
    repositories.surveys.findByIdWithQuestions.mockResolvedValue(mockDetail);
    await expect(service.getSurveyForAnswering('s1', 'user-1', ['titulado'])).resolves.toBe(mockDetail);
  });

  it('permite guardar respuestas válidas para una encuesta publicada', async () => {
    const mockSurvey = {
      id: 's1',
      title: 'Test',
      status: 'published',
      targetAudience: 'all',
      isExpired: false,
      hasAnswered: false,
      questions: [
        {
          id: 'q1',
          position: 1,
          statement: 'P1',
          type: 'single_choice',
          isRequired: true,
          options: [],
        },
      ],
    };
    repositories.surveys.findByIdWithQuestions.mockResolvedValue(mockSurvey);
    repositories.surveys.submitResponse.mockResolvedValue(undefined);

    const payload = {
      answers: [{ questionId: 'q1', optionIds: ['opt1'] }],
    };

    const res = await service.submitResponse('s1', 'user-1', payload, ['estudiante']);
    expect(res.success).toBe(true);
    expect(repositories.surveys.submitResponse).toHaveBeenCalledWith(
      's1',
      'user-1',
      payload.answers,
    );
  });
});


