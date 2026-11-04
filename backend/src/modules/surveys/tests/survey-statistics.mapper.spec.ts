import { describe, expect, it } from 'vitest';
import { SurveyMapper } from '../mappers/survey.mapper.js';
import type { SurveyStatisticsRecord } from '../types/survey-record.type.js';

const NOW = new Date('2026-11-03T15:00:00.000Z');

interface QuestionInput {
  id: string;
  type: string;
  isRequired?: boolean;
  options: { id: string; label: string; answers: number }[];
  answers?: number;
}

function question(input: QuestionInput, position: number) {
  const selections = input.options.reduce(
    (total, option) => total + option.answers,
    0,
  );
  return {
    id: input.id,
    position,
    statement: `Pregunta ${position}`,
    isRequired: input.isRequired ?? true,
    type: { title: input.type },
    options: input.options.map((option, index) => ({
      id: option.id,
      position: index + 1,
      label: option.label,
      _count: { answers: option.answers },
    })),
    _count: { answers: input.answers ?? selections },
  };
}

function record(
  questions: QuestionInput[],
  responses: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'survey-1',
    title: 'Encuesta de empleabilidad 2020',
    description: null,
    academicPeriod: '2020',
    opensAt: new Date('2026-10-27T04:00:00.000Z'),
    closesAt: new Date('2027-11-03T04:00:00.000Z'),
    createdAt: new Date('2026-10-24T20:00:00.000Z'),
    status: { title: 'published' },
    career: { id: 'career-1', title: 'Sistemas' },
    questions: questions.map((item, index) => question(item, index + 1)),
    _count: { responses },
    ...overrides,
  } as unknown as SurveyStatisticsRecord;
}

const SINGLE: QuestionInput = {
  id: 'q1',
  type: 'single_choice',
  options: [
    { id: 'a', label: 'Tiempo completo', answers: 2 },
    { id: 'b', label: 'Medio tiempo', answers: 0 },
    { id: 'c', label: 'Independiente', answers: 3 },
    { id: 'd', label: 'Buscando empleo', answers: 0 },
  ],
};

const MULTIPLE: QuestionInput = {
  id: 'q2',
  type: 'multiple_choice',
  options: [
    { id: 'e', label: 'Programación', answers: 3 },
    { id: 'f', label: 'Bases de datos', answers: 3 },
    { id: 'g', label: 'Gestión', answers: 2 },
    { id: 'h', label: 'Redes', answers: 2 },
  ],
};

describe('SurveyMapper.toStatisticsResponse', () => {
  const mapper = new SurveyMapper();

  it('devuelve cada pregunta con todas sus opciones, también las que tienen 0', () => {
    const result = mapper.toStatisticsResponse(record([SINGLE], 5), NOW);

    expect(result.questions).toHaveLength(1);
    expect(
      result.questions[0].options.map(({ label, count, percentage }) => [
        label,
        count,
        percentage,
      ]),
    ).toEqual([
      ['Tiempo completo', 2, 40],
      ['Medio tiempo', 0, 0],
      ['Independiente', 3, 60],
      ['Buscando empleo', 0, 0],
    ]);
  });

  it('la suma de conteos de las opciones es igual al total de respuestas de la pregunta', () => {
    const [single, multiple] = mapper.toStatisticsResponse(
      record([SINGLE, MULTIPLE], 5),
      NOW,
    ).questions;

    [single, multiple].forEach((item) => {
      const counted = item.options.reduce(
        (total, option) => total + option.count,
        0,
      );
      expect(counted).toBe(item.totalSelections);
      expect(counted).toBe(item.answeredCount);
    });
  });

  it('en opción única los porcentajes suman 100%', () => {
    const [single] = mapper.toStatisticsResponse(
      record([SINGLE], 5),
      NOW,
    ).questions;

    expect(
      single.options.reduce((total, option) => total + option.percentage, 0),
    ).toBe(100);
  });

  it('en opción múltiple los porcentajes se calculan sobre las selecciones y suman 100%, no 200%', () => {
    const [multiple] = mapper.toStatisticsResponse(
      record([MULTIPLE], 5),
      NOW,
    ).questions;

    expect(multiple.totalSelections).toBe(10);
    expect(multiple.options.map((option) => option.percentage)).toEqual([
      30, 30, 20, 20,
    ]);
    expect(
      multiple.options.reduce((total, option) => total + option.percentage, 0),
    ).toBe(100);
  });

  it('con una pregunta opcional que no todos respondieron los porcentajes igual suman 100%', () => {
    const optional: QuestionInput = {
      id: 'q3',
      type: 'single_choice',
      isRequired: false,
      options: [
        { id: 'i', label: 'Sí', answers: 1 },
        { id: 'j', label: 'No', answers: 2 },
      ],
    };

    const [item] = mapper.toStatisticsResponse(
      record([optional], 10),
      NOW,
    ).questions;

    expect(
      item.options.reduce((total, option) => total + option.percentage, 0),
    ).toBe(100);
  });

  it('un periodo sin respuestas conserva preguntas y opciones en cero e indica que no hay datos', () => {
    const empty = record(
      [
        {
          ...SINGLE,
          options: SINGLE.options.map((option) => ({ ...option, answers: 0 })),
        },
        {
          ...MULTIPLE,
          options: MULTIPLE.options.map((option) => ({
            ...option,
            answers: 0,
          })),
        },
      ],
      0,
    );

    const result = mapper.toStatisticsResponse(empty, NOW, {
      period: 'I-2026',
    });

    expect(result.hasData).toBe(false);
    expect(result.totalResponses).toBe(0);
    expect(result.period).toBe('I-2026');
    expect(result.questions).toHaveLength(2);
    result.questions.forEach((item) => {
      expect(
        item.options.every(
          (option) => option.count === 0 && option.percentage === 0,
        ),
      ).toBe(true);
      expect(item.trend.direction).toBe('neutral');
      expect(item.trend.text).toBe(
        'Sin respuestas registradas en este periodo.',
      );
    });
  });

  it('marca hasData cuando hay respuestas y deja el periodo en null si se consultan todas', () => {
    const result = mapper.toStatisticsResponse(record([SINGLE], 5), NOW);

    expect(result.hasData).toBe(true);
    expect(result.period).toBeNull();
  });

  it('cada pregunta trae su tendencia principal', () => {
    const [single, multiple] = mapper.toStatisticsResponse(
      record([SINGLE, MULTIPLE], 5),
      NOW,
    ).questions;

    expect(single.trend).toEqual({
      text: 'La opción más elegida es «Independiente» con 60% (3 de 5 respuestas).',
      direction: 'neutral',
    });
    expect(multiple.trend.text).toBe(
      'Hay un empate entre «Programación» y «Bases de datos» con 30% cada una.',
    );
  });

  it('compara con el semestre anterior para decir si la opción principal sube', () => {
    const previous = record(
      [
        {
          ...SINGLE,
          options: SINGLE.options.map((option, index) => ({
            ...option,
            answers: [3, 0, 1, 0][index],
          })),
        },
      ],
      4,
    );

    const [item] = mapper.toStatisticsResponse(record([SINGLE], 5), NOW, {
      period: 'II-2026',
      previous: { period: 'I-2026', record: previous },
    }).questions;

    expect(item.trend.direction).toBe('up');
    expect(item.trend.text).toContain('Sube 35 pts frente a I-2026.');
  });

  it('sin respuestas en el semestre anterior no inventa una comparación', () => {
    const previous = record(
      [
        {
          ...SINGLE,
          options: SINGLE.options.map((option) => ({ ...option, answers: 0 })),
        },
      ],
      0,
    );

    const [item] = mapper.toStatisticsResponse(record([SINGLE], 5), NOW, {
      period: 'II-2026',
      previous: { period: 'I-2026', record: previous },
    }).questions;

    expect(item.trend.direction).toBe('neutral');
    expect(item.trend.text).not.toContain('frente a');
  });

  it('ignora el semestre anterior si no trae esa pregunta', () => {
    const previous = record([{ ...SINGLE, id: 'otra-pregunta' }], 4);

    const [item] = mapper.toStatisticsResponse(record([SINGLE], 5), NOW, {
      period: 'II-2026',
      previous: { period: 'I-2026', record: previous },
    }).questions;

    expect(item.trend.text).not.toContain('frente a');
  });

  it('ofrece los semestres desde la apertura hasta hoy', () => {
    const result = mapper.toStatisticsResponse(
      record([SINGLE], 5, { opensAt: new Date('2025-09-01T12:00:00.000Z') }),
      new Date('2026-08-01T12:00:00.000Z'),
    );

    expect(result.availablePeriods).toEqual(['II-2026', 'I-2026', 'II-2025']);
  });

  it('si la encuesta ya cerró, los semestres llegan solo hasta el cierre', () => {
    const result = mapper.toStatisticsResponse(
      record([SINGLE], 5, {
        opensAt: new Date('2025-09-01T12:00:00.000Z'),
        closesAt: new Date('2026-02-01T12:00:00.000Z'),
      }),
      NOW,
    );

    expect(result.availablePeriods).toEqual(['I-2026', 'II-2025']);
  });

  it('usa la fecha de creación si la encuesta no tiene apertura', () => {
    const result = mapper.toStatisticsResponse(
      record([SINGLE], 5, { opensAt: null, closesAt: null }),
      NOW,
    );

    expect(result.availablePeriods).toEqual(['II-2026']);
  });

  it('si la apertura es futura ofrece al menos el semestre de la apertura', () => {
    const result = mapper.toStatisticsResponse(
      record([SINGLE], 0, {
        opensAt: new Date('2027-02-01T12:00:00.000Z'),
        closesAt: null,
      }),
      NOW,
    );

    expect(result.availablePeriods).toEqual(['I-2027']);
  });
});
