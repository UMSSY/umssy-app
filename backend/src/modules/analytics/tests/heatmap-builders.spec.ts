import { HEATMAP_EXTRA_COLUMNS } from '../constants/heatmap.constants.js';
import type { HeatmapResponse } from '../types/heatmap.types.js';
import { buildCareerHeatmap } from '../utils/build-career-heatmap.util.js';
import { buildEmployabilityHeatmap } from '../utils/build-employability-heatmap.util.js';
import { buildExperienceHeatmap } from '../utils/build-experience-heatmap.util.js';
import { buildSalaryHeatmap } from '../utils/build-salary-heatmap.util.js';
import { GIT, PYTHON, SQL, graduate, nlp } from './heatmap-fixtures.js';

const CAREERS = [
  { id: 'career-systems', title: 'Licenciatura en Ingeniería de Sistemas' },
  { id: 'career-informatics', title: 'Licenciatura Ingeniería en Informática' },
];

const cellOf = (data: HeatmapResponse, skillId: string, columnId: string) =>
  data.rows.find((row) => row.skillId === skillId)?.cells.find((cell) => cell.columnId === columnId);

describe('buildCareerHeatmap (HU5)', () => {
  it('calcula conteo y porcentaje sobre el total evaluado de cada carrera', () => {
    const data = buildCareerHeatmap(
      [
        graduate({ skills: [SQL] }),
        graduate({ skills: [SQL, PYTHON] }),
        graduate({ skills: [PYTHON] }),
        graduate({ skills: [GIT] }),
        graduate({ careerId: 'career-informatics', skills: [SQL] }),
        graduate({ careerId: 'career-informatics', skills: [] }),
      ],
      CAREERS,
    );

    expect(data.baseCount).toBe(5);
    expect(data.columns.map((column) => column.label)).toEqual(['Ing. de Sistemas (n=4)', 'Ing. Informática (n=1)']);
    expect(cellOf(data, SQL.id, 'career-systems')).toMatchObject({ count: 2, total: 4, percentage: 50 });
    expect(cellOf(data, SQL.id, 'career-informatics')).toMatchObject({ count: 1, total: 1, percentage: 100 });
    expect(data.rows[0]!.skillId).toBe(SQL.id);
    expect(data.quickReadSummary).toContain('SQL');
  });

  it('marca como vacías las celdas de carreras sin egresados y omite la lectura rápida', () => {
    const data = buildCareerHeatmap([graduate({ skills: [SQL] })], CAREERS);

    expect(cellOf(data, SQL.id, 'career-informatics')).toMatchObject({ isEmpty: true });
    expect(data.quickReadSummary).toBeUndefined();
  });
});

describe('buildSalaryHeatmap (HU6)', () => {
  it('excluye titulados sin salario o sin habilidades NLP y ordena los rangos de menor a mayor', () => {
    const data = buildSalaryHeatmap([
      graduate({ salaryRange: 'up-to-3000', skills: [nlp(SQL)] }),
      graduate({ salaryRange: '3000-5000', skills: [nlp(SQL), PYTHON] }),
      graduate({ salaryRange: 'over-12000', skills: [nlp(PYTHON)] }),
      graduate({ salaryRange: null, skills: [nlp(SQL)] }),
      graduate({ salaryRange: '5000-8000', skills: [SQL] }),
    ]);

    expect(data.baseCount).toBe(3);
    expect(data.columns.map((column) => column.id)).toEqual(['up-to-3000', '3000-5000', '5000-8000', '8000-12000', 'over-12000']);
    expect(cellOf(data, SQL.id, 'up-to-3000')).toMatchObject({ count: 1, total: 1, percentage: 100 });
    expect(cellOf(data, PYTHON.id, '3000-5000')).toMatchObject({ count: 0, total: 1 });
    expect(cellOf(data, SQL.id, '5000-8000')).toMatchObject({ isEmpty: true });
    expect(data.quickReadSummary).toContain('Más de Bs 12.000');
  });

  it('devuelve una base vacía sin lectura rápida', () => {
    expect(buildSalaryHeatmap([])).toMatchObject({ baseCount: 0, rows: [], quickReadSummary: undefined });
  });
});

describe('buildEmployabilityHeatmap (HU7)', () => {
  it('calcula la retención laboral y ordena las filas de mayor a menor retención', () => {
    const data = buildEmployabilityHeatmap([
      graduate({ skills: [SQL], employmentStatus: 'employed-in-field' }),
      graduate({ skills: [SQL], employmentStatus: 'self-employed' }),
      graduate({ skills: [SQL, PYTHON], employmentStatus: 'job-seeking' }),
      graduate({ skills: [PYTHON], employmentStatus: 'job-seeking' }),
      graduate({ skills: [GIT], employmentStatus: 'employed-other-field' }),
      graduate({ skills: [GIT], employmentStatus: null }),
    ]);
    const retention = (skillId: string) =>
      data.rows.find((row) => row.skillId === skillId)?.extraValues?.[HEATMAP_EXTRA_COLUMNS.jobRetention.id];

    expect(data.baseCount).toBe(5);
    expect(retention(GIT.id)).toMatchObject({ percentage: 100, count: 1 });
    expect(retention(SQL.id)).toMatchObject({ percentage: 67, count: 2, subtext: '2 de 3' });
    expect(retention(PYTHON.id)).toMatchObject({ percentage: 0 });
    expect(data.rows.map((row) => row.skillId)).toEqual([GIT.id, SQL.id, PYTHON.id]);
    expect(data.columns.map((column) => column.total)).toEqual([1, 1, 1, 2]);
    expect(data.quickReadSummary).toContain('Git');
  });
});

describe('buildExperienceHeatmap (HU8)', () => {
  it('calcula el total que domina la habilidad y el nivel de mayor adopción', () => {
    const data = buildExperienceHeatmap([
      graduate({ experienceYears: 1, skills: [SQL] }),
      graduate({ experienceYears: 2, skills: [] }),
      graduate({ experienceYears: 3, skills: [SQL] }),
      graduate({ experienceYears: 8, skills: [SQL, PYTHON] }),
      graduate({ experienceYears: null, skills: [SQL] }),
    ]);
    const sql = data.rows.find((row) => row.skillId === SQL.id);

    expect(data.baseCount).toBe(4);
    expect(data.columns.map((column) => column.sublabel)).toEqual([
      'hasta 2 años · 2 titulados',
      '2 a 5 años · 1 titulados',
      'más de 5 años · 1 titulados',
    ]);
    expect(sql?.cells.map((cell) => cell.percentage)).toEqual([50, 100, 100]);
    expect(sql?.extraValues?.[HEATMAP_EXTRA_COLUMNS.totalMastering.id]).toEqual({ count: 3, percentage: 75, subtext: '75 % del total' });
    expect(sql?.extraValues?.[HEATMAP_EXTRA_COLUMNS.highestAdoption.id]).toEqual({ badgeText: 'Semi-Senior' });
    expect(data.extraColumnsConfig?.[0]?.sublabel).toBe('de 4 titulados');
    expect(data.rows[0]!.skillId).toBe(SQL.id);
    expect(data.quickReadSummary).toContain('Semi-Senior');
  });

  it('no asigna mayor adopción cuando nadie domina la habilidad en ningún nivel', () => {
    const data = buildExperienceHeatmap([graduate({ experienceYears: 1, skills: [] })]);
    expect(data.rows).toEqual([]);
    expect(data.quickReadSummary).toBeUndefined();
  });
});
