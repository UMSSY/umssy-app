import { computeExperienceYears, getExperienceLevelIndex } from '../utils/experience-years.util.js';
import { boliviaMonth, shortenCareerTitle, yearToRange } from '../utils/heatmap-dates.util.js';
import { buildCell, toPercentage } from '../utils/heatmap-math.util.js';
import { selectTopSkills, allSkills, nlpSkills } from '../utils/heatmap-skills.util.js';
import { GIT, PYTHON, SQL, graduate, nlp } from './heatmap-fixtures.js';

const NOW = new Date('2026-01-01T00:00:00.000Z');

describe('computeExperienceYears', () => {
  it('devuelve null sin experiencia registrada', () => {
    expect(computeExperienceYears([], NOW)).toBeNull();
  });

  it('suma periodos separados y une los superpuestos', () => {
    const years = computeExperienceYears(
      [
        { startDate: new Date('2020-01-01'), endDate: new Date('2022-01-01') },
        { startDate: new Date('2021-01-01'), endDate: new Date('2023-01-01') },
        { startDate: new Date('2024-01-01'), endDate: null },
      ],
      NOW,
    );
    expect(years).toBe(5);
  });

  it('ignora periodos inválidos o futuros', () => {
    expect(computeExperienceYears([{ startDate: new Date('2027-01-01'), endDate: null }], NOW)).toBeNull();
  });
});

describe('getExperienceLevelIndex', () => {
  it.each([
    [0, 0],
    [2, 0],
    [2.1, 1],
    [5, 1],
    [5.5, 2],
  ])('clasifica %s años en el nivel %s', (years, level) => {
    expect(getExperienceLevelIndex(years)).toBe(level);
  });
});

describe('heatmap dates', () => {
  it('convierte una gestión al rango completo en hora de Bolivia', () => {
    const range = yearToRange(2024);
    expect(range.from.toISOString()).toBe('2024-01-01T04:00:00.000Z');
    expect(range.to.toISOString()).toBe('2025-01-01T03:59:59.999Z');
  });

  it('obtiene el mes en hora de Bolivia', () => {
    expect(boliviaMonth(new Date('2024-07-01T02:00:00.000Z'))).toBe(6);
  });

  it('abrevia los nombres de carrera', () => {
    expect(shortenCareerTitle('Licenciatura en Ingeniería de Sistemas')).toBe('Ing. de Sistemas');
    expect(shortenCareerTitle('Licenciatura Ingeniería en Informática')).toBe('Ing. Informática');
  });
});

describe('heatmap math', () => {
  it('calcula porcentajes redondeados y celdas vacías', () => {
    expect(toPercentage(2, 3)).toBe(67);
    expect(toPercentage(1, 0)).toBe(0);
    expect(buildCell('a', 0, 0)).toEqual({ columnId: 'a', count: 0, total: 0, isEmpty: true });
  });
});

describe('selectTopSkills', () => {
  it('ordena por cantidad de titulados, desempata por nombre y respeta el límite', () => {
    const graduates = [graduate({ skills: [SQL, PYTHON] }), graduate({ skills: [SQL, nlp(GIT)] })];
    expect(selectTopSkills(graduates, allSkills, 2).map((skill) => skill.name)).toEqual(['SQL', 'Git']);
    expect(selectTopSkills(graduates, nlpSkills).map((skill) => skill.name)).toEqual(['Git']);
  });
});
