import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SURVEY_VALIDATION_MESSAGES as MESSAGES } from '../constants/survey.constants.js';
import { createSurveySchema } from '../requests/create-survey.schema.js';

const VALID_QUESTION = {
  statement: '¿Cuál es tu condición laboral actual?',
  type: 'single_choice',
  isRequired: true,
  options: [{ label: 'Empleado' }, { label: 'Independiente' }],
};

const VALID_PUBLISHED = {
  title: 'Encuesta de Empleabilidad de Egresados',
  description: 'Esta encuesta nos ayuda a conocer tu situación laboral.',
  careerId: randomUUID(),
  academicPeriod: 'II-2026',
  opensAt: '2026-11-03T04:00:00.000Z',
  closesAt: '2026-12-16T03:59:59.999Z',
  status: 'published',
  questions: [VALID_QUESTION],
};

function parse(overrides: Record<string, unknown>) {
  return createSurveySchema.safeParse({ ...VALID_PUBLISHED, ...overrides });
}

function issues(overrides: Record<string, unknown>) {
  const result = parse(overrides);
  return result.success
    ? []
    : result.error.issues.map(({ path, message }) => ({ path: path.join('.'), message }));
}

describe('createSurveySchema', () => {
  it('acepta una encuesta publicada completa', () => {
    const result = parse({});

    expect(result.success).toBe(true);
    expect(result.data?.questions[0].options).toHaveLength(2);
  });

  it('acepta un borrador que solo tiene título', () => {
    const result = createSurveySchema.safeParse({ title: 'Borrador inicial', status: 'draft' });

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Borrador inicial');
    expect(result.data?.questions).toEqual([]);
    expect(result.data?.careerId).toBeUndefined();
    expect(result.data?.opensAt).toBeUndefined();
  });

  it('convierte los campos opcionales vacíos o nulos en indefinidos', () => {
    const result = createSurveySchema.safeParse({
      title: 'Borrador inicial',
      status: 'draft',
      description: '',
      careerId: '',
      academicPeriod: null,
      opensAt: '',
    });

    expect(result.success).toBe(true);
    expect(result.data?.description).toBeUndefined();
    expect(result.data?.careerId).toBeUndefined();
    expect(result.data?.academicPeriod).toBeUndefined();
    expect(result.data?.opensAt).toBeUndefined();
  });

  it('recorta los espacios del título y de las opciones', () => {
    const result = parse({
      title: '   Encuesta 2026   ',
      questions: [{ ...VALID_QUESTION, options: [{ label: '  Sí ' }, { label: 'No' }] }],
    });

    expect(result.data?.title).toBe('Encuesta 2026');
    expect(result.data?.questions[0].options[0].label).toBe('Sí');
  });

  it.each([
    ['vacío', '', MESSAGES.TITLE_TOO_SHORT],
    ['solo espacios', '         ', MESSAGES.TITLE_TOO_SHORT],
    ['de menos de 5 caracteres', 'Hola', MESSAGES.TITLE_TOO_SHORT],
    ['de más de 150 caracteres', 'a'.repeat(151), MESSAGES.TITLE_TOO_LONG],
    ['ausente', undefined, MESSAGES.TITLE_REQUIRED],
  ])('rechaza un título %s incluso en borrador', (_case, title, message) => {
    const result = createSurveySchema.safeParse({ title, status: 'draft' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ['title'], message });
  });

  it('acepta un título de exactamente 5 y 150 caracteres', () => {
    expect(parse({ title: 'abcde' }).success).toBe(true);
    expect(parse({ title: 'a'.repeat(150) }).success).toBe(true);
  });

  it('rechaza una descripción de más de 500 caracteres', () => {
    expect(issues({ description: 'a'.repeat(501) })).toContainEqual({
      path: 'description',
      message: MESSAGES.DESCRIPTION_TOO_LONG,
    });
  });

  it('rechaza un estado desconocido', () => {
    expect(issues({ status: 'archived' })).toContainEqual({
      path: 'status',
      message: MESSAGES.INVALID_STATUS,
    });
  });

  it('rechaza un identificador de carrera inválido', () => {
    expect(issues({ careerId: 'no-es-uuid' })).toContainEqual({
      path: 'careerId',
      message: MESSAGES.INVALID_CAREER_ID,
    });
  });

  it.each(['2-2026', 'III-2026', 'II-26'])('rechaza la gestión %s', (academicPeriod) => {
    expect(issues({ academicPeriod })).toContainEqual({
      path: 'academicPeriod',
      message: MESSAGES.INVALID_ACADEMIC_PERIOD,
    });
  });

  it('rechaza fechas que no están en formato ISO', () => {
    expect(issues({ opensAt: '03/11/2026' })).toContainEqual({
      path: 'opensAt',
      message: MESSAGES.INVALID_DATE,
    });
  });

  it('exige carrera, gestión y fechas al publicar', () => {
    const result = issues({
      careerId: undefined,
      academicPeriod: undefined,
      opensAt: undefined,
      closesAt: undefined,
    });

    expect(result).toEqual(
      expect.arrayContaining([
        { path: 'careerId', message: MESSAGES.CAREER_REQUIRED },
        { path: 'academicPeriod', message: MESSAGES.ACADEMIC_PERIOD_REQUIRED },
        { path: 'opensAt', message: MESSAGES.OPENS_AT_REQUIRED },
        { path: 'closesAt', message: MESSAGES.CLOSES_AT_REQUIRED },
      ]),
    );
  });

  it('exige al menos una pregunta al publicar', () => {
    expect(issues({ questions: [] })).toContainEqual({
      path: 'questions',
      message: MESSAGES.QUESTIONS_REQUIRED,
    });
  });

  it('exige el enunciado de cada pregunta al publicar con la ruta exacta', () => {
    const questions = [VALID_QUESTION, VALID_QUESTION, VALID_QUESTION, { ...VALID_QUESTION, statement: '  ' }];

    expect(issues({ questions })).toContainEqual({
      path: 'questions.3.statement',
      message: MESSAGES.STATEMENT_REQUIRED,
    });
  });

  it('exige al menos 2 opciones por pregunta al publicar', () => {
    const questions = [{ ...VALID_QUESTION, options: [{ label: 'Única' }] }];

    expect(issues({ questions })).toContainEqual({
      path: 'questions.0.options',
      message: MESSAGES.OPTIONS_TOO_FEW,
    });
  });

  it('rechaza opciones repetidas sin distinguir mayúsculas ni espacios', () => {
    const questions = [{ ...VALID_QUESTION, options: [{ label: 'Sí' }, { label: '  sí ' }] }];

    expect(issues({ questions })).toContainEqual({
      path: 'questions.0.options',
      message: MESSAGES.OPTIONS_DUPLICATED,
    });
  });

  it('no aplica las reglas de publicación a un borrador', () => {
    const result = createSurveySchema.safeParse({
      title: 'Borrador con preguntas',
      status: 'draft',
      questions: [{ ...VALID_QUESTION, statement: '', options: [{ label: 'Sí' }, { label: 'sí' }] }],
    });

    expect(result.success).toBe(true);
  });

  it('rechaza enunciados de más de 250 caracteres y opciones de más de 100', () => {
    const questions = [
      { ...VALID_QUESTION, statement: 'a'.repeat(251), options: [{ label: 'b'.repeat(101) }, { label: 'c' }] },
    ];

    expect(issues({ questions })).toEqual(
      expect.arrayContaining([
        { path: 'questions.0.statement', message: MESSAGES.STATEMENT_TOO_LONG },
        { path: 'questions.0.options.0.label', message: MESSAGES.OPTION_TOO_LONG },
      ]),
    );
  });

  it('rechaza opciones vacías', () => {
    const questions = [{ ...VALID_QUESTION, options: [{ label: ' ' }, { label: 'No' }] }];

    expect(issues({ questions })).toContainEqual({
      path: 'questions.0.options.0.label',
      message: MESSAGES.OPTION_REQUIRED,
    });
  });

  it.each(['short_text', 'dropdown'])('rechaza el tipo de pregunta %s', (type) => {
    const questions = [{ ...VALID_QUESTION, type }];

    expect(issues({ questions })).toContainEqual({
      path: 'questions.0.type',
      message: MESSAGES.INVALID_QUESTION_TYPE,
    });
  });

  it('marca las preguntas como obligatorias por defecto', () => {
    const { isRequired: _isRequired, ...question } = VALID_QUESTION;
    const result = parse({ questions: [question] });

    expect(result.data?.questions[0].isRequired).toBe(true);
  });
});
