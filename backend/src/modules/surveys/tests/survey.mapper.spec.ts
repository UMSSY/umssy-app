import { describe, expect, it } from 'vitest';
import { SurveyMapper } from '../mappers/survey.mapper.js';
import type { CreateSurveyRequest } from '../requests/create-survey.schema.js';

const mapper = new SurveyMapper();
const CREATED_AT = new Date('2026-10-22T12:00:00.000Z');

describe('SurveyMapper', () => {
  it('convierte la solicitud a los datos de persistencia', () => {
    const data = mapper.toCreateData(
      {
        title: 'Encuesta',
        description: 'Descripción',
        careerId: 'career-1',
        academicPeriod: 'II-2026',
        targetAudience: 'students',
        opensAt: '2026-11-03T04:00:00.000Z',
        closesAt: '2026-12-16T03:59:59.999Z',
        status: 'published',
        questions: [
          { statement: 'A', type: 'single_choice', isRequired: true, options: [{ label: 'x' }] },
          { statement: 'B', type: 'multiple_choice', isRequired: false, options: [] },
        ],
      },
      'admin-1',
    );

    expect(data).toEqual({
      title: 'Encuesta',
      description: 'Descripción',
      careerId: 'career-1',
      targetsAllCareers: false,
      academicPeriod: 'II-2026',
      targetAudience: 'students',
      opensAt: new Date('2026-11-03T04:00:00.000Z'),
      closesAt: new Date('2026-12-16T03:59:59.999Z'),
      status: 'published',
      createdById: 'admin-1',
      questions: [
        { statement: 'A', type: 'single_choice', isRequired: true, options: [{ label: 'x' }] },
        { statement: 'B', type: 'multiple_choice', isRequired: false, options: [] },
      ],
    });
  });

  it('usa null en los campos opcionales ausentes de un borrador', () => {
    expect(mapper.toCreateData({ title: 'Borrador', status: 'draft', questions: [] }, 'admin-1')).toEqual({
      title: 'Borrador',
      description: null,
      careerId: null,
      targetsAllCareers: false,
      academicPeriod: null,
      targetAudience: null,
      opensAt: null,
      closesAt: null,
      status: 'draft',
      createdById: 'admin-1',
      questions: [],
    });
  });

  it('guarda Todas las carreras como una encuesta sin carrera', () => {
    const request = { title: 'Global', status: 'draft', careerId: 'all', questions: [] } as const;
    const data = mapper.toCreateData(request as unknown as CreateSurveyRequest, 'admin-1');

    expect(data).toMatchObject({ careerId: null, targetsAllCareers: true });
  });

  it('expone el estado de la encuesta creada en minúsculas', () => {
    expect(
      mapper.toCreatedResponse({ id: 'survey-1', title: 'Encuesta', status: { title: 'draft' }, createdAt: CREATED_AT }),
    ).toEqual({ id: 'survey-1', title: 'Encuesta', status: 'draft', createdAt: CREATED_AT.toISOString() });
  });

  it('resume una encuesta sin carrera ni fechas', () => {
    expect(
      mapper.toSummaryResponse({
        id: 'survey-1',
        title: 'Borrador',
        status: { title: 'draft' },
        academicPeriod: null,
        targetAudience: { title: 'mentors' },
        opensAt: null,
        closesAt: null,
        createdAt: CREATED_AT,
        career: null,
        createdBy: { firstName: 'Admin', lastName: 'Uno', email: 'admin.1@umssy.test' },
        _count: { questions: 0, responses: 0 },
      }),
    ).toEqual({
      id: 'survey-1',
      title: 'Borrador',
      status: 'draft',
      career: null,
      createdBy: { fullName: 'Admin Uno', email: 'admin.1@umssy.test' },
      academicPeriod: null,
      targetAudience: 'mentors',
      opensAt: null,
      closesAt: null,
      questionCount: 0,
      responseCount: 0,
      createdAt: CREATED_AT.toISOString(),
    });
  });

  it('convierte una carrera a su respuesta', () => {
    expect(mapper.toCareerResponse({ id: 'career-1', title: 'Sistemas' })).toEqual({
      id: 'career-1',
      title: 'Sistemas',
    });
  });
});
