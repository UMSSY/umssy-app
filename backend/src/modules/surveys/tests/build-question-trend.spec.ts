import { describe, expect, it } from 'vitest';
import {
  buildQuestionTrend,
  NO_RESPONSES_TREND_TEXT,
  type TrendComparison,
} from '../utils/build-question-trend.js';

const OPTIONS = [
  { id: 'a', label: 'Empleado', count: 3, percentage: 60 },
  { id: 'b', label: 'Independiente', count: 2, percentage: 40 },
  { id: 'c', label: 'Buscando empleo', count: 0, percentage: 0 },
];

function comparison(percentages: Record<string, number>): TrendComparison {
  return {
    period: 'I-2026',
    percentageByOption: new Map(Object.entries(percentages)),
  };
}

describe('buildQuestionTrend', () => {
  it('describe la opción más elegida con su porcentaje y sus votos', () => {
    expect(
      buildQuestionTrend({
        options: OPTIONS,
        totalSelections: 5,
        isMultipleChoice: false,
      }),
    ).toEqual({
      text: 'La opción más elegida es «Empleado» con 60% (3 de 5 respuestas).',
      direction: 'neutral',
    });
  });

  it('en opción múltiple habla de selecciones', () => {
    const { text } = buildQuestionTrend({
      options: OPTIONS,
      totalSelections: 5,
      isMultipleChoice: true,
    });

    expect(text).toContain('(3 de 5 selecciones)');
  });

  it('indica un empate entre las opciones líderes', () => {
    const tied = [
      { id: 'a', label: 'Sí', count: 2, percentage: 40 },
      { id: 'b', label: 'No', count: 2, percentage: 40 },
      { id: 'c', label: 'Tal vez', count: 1, percentage: 20 },
    ];

    expect(
      buildQuestionTrend({
        options: tied,
        totalSelections: 5,
        isMultipleChoice: false,
      }),
    ).toEqual({
      text: 'Hay un empate entre «Sí» y «No» con 40% cada una.',
      direction: 'neutral',
    });
  });

  it('une con comas y "y" cuando empatan más de dos', () => {
    const tied = ['A', 'B', 'C'].map((label, index) => ({
      id: `o${index}`,
      label,
      count: 1,
      percentage: 33.3,
    }));

    expect(
      buildQuestionTrend({
        options: tied,
        totalSelections: 3,
        isMultipleChoice: false,
      }).text,
    ).toBe('Hay un empate entre «A», «B» y «C» con 33.3% cada una.');
  });

  it('sin respuestas devuelve un texto neutro en lugar de dejar el card sin tendencia', () => {
    const empty = OPTIONS.map((option) => ({
      ...option,
      count: 0,
      percentage: 0,
    }));

    expect(
      buildQuestionTrend({
        options: empty,
        totalSelections: 0,
        isMultipleChoice: false,
      }),
    ).toEqual({
      text: NO_RESPONSES_TREND_TEXT,
      direction: 'neutral',
    });
  });

  it('sube cuando la opción principal gana al menos 1 punto frente al semestre anterior', () => {
    const result = buildQuestionTrend({
      options: OPTIONS,
      totalSelections: 5,
      isMultipleChoice: false,
      comparison: comparison({ a: 47.5, b: 52.5, c: 0 }),
    });

    expect(result.direction).toBe('up');
    expect(result.text).toContain('Sube 12.5 pts frente a I-2026.');
  });

  it('baja cuando la opción principal pierde al menos 1 punto', () => {
    const result = buildQuestionTrend({
      options: OPTIONS,
      totalSelections: 5,
      isMultipleChoice: false,
      comparison: comparison({ a: 75, b: 25, c: 0 }),
    });

    expect(result.direction).toBe('down');
    expect(result.text).toContain('Baja 15 pts frente a I-2026.');
  });

  it('se mantiene estable si la variación es menor a 1 punto', () => {
    const result = buildQuestionTrend({
      options: OPTIONS,
      totalSelections: 5,
      isMultipleChoice: false,
      comparison: comparison({ a: 59.5, b: 40.5, c: 0 }),
    });

    expect(result.direction).toBe('neutral');
    expect(result.text).toContain('Se mantiene estable frente a I-2026.');
  });

  it('si la opción principal no existía el semestre anterior cuenta como 0 y sube', () => {
    const result = buildQuestionTrend({
      options: OPTIONS,
      totalSelections: 5,
      isMultipleChoice: false,
      comparison: comparison({ b: 100 }),
    });

    expect(result.direction).toBe('up');
  });

  it('ignora la comparación si el semestre anterior no tuvo respuestas', () => {
    const result = buildQuestionTrend({
      options: OPTIONS,
      totalSelections: 5,
      isMultipleChoice: false,
      comparison: comparison({}),
    });

    expect(result).toEqual({
      text: 'La opción más elegida es «Empleado» con 60% (3 de 5 respuestas).',
      direction: 'neutral',
    });
  });
});
