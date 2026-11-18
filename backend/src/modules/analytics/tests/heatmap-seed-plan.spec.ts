import { HEATMAP_SEED_SKILLS } from '../constants/heatmap-seed.constants.js';
import { buildHeatmapSeedPlan } from '../utils/heatmap-seed-plan.util.js';

const ANCHOR = new Date('2026-11-12T12:00:00.000Z');

describe('buildHeatmapSeedPlan', () => {
  const plan = buildHeatmapSeedPlan(ANCHOR);

  it('es determinista para que el seed sea idempotente', () => {
    expect(buildHeatmapSeedPlan(ANCHOR)).toEqual(plan);
  });

  it('cubre todas las columnas de los mapas de calor', () => {
    const responses = plan.flatMap((graduate) => (graduate.response ? [graduate.response] : []));
    expect(new Set(responses.map((response) => response.employmentOptionIndex))).toEqual(new Set([0, 1, 2, 3]));
    expect(new Set(responses.map((response) => response.salaryOptionIndex))).toEqual(new Set([0, 1, 2, 3, 4, null]));
    expect(plan.some((graduate) => graduate.workExperiences.length === 0)).toBe(true);
    expect(plan.some((graduate) => graduate.skills.some((skill) => skill.source === 'nlp'))).toBe(true);
    expect(plan.some((graduate) => graduate.response === null)).toBe(true);
  });

  it('usa solo habilidades del catálogo y fechas válidas', () => {
    const catalog = new Set<string>(HEATMAP_SEED_SKILLS.map((skill) => skill.name));
    for (const graduate of plan) {
      expect(graduate.skills.every((skill) => catalog.has(skill.name))).toBe(true);
      if (graduate.response) expect(graduate.response.submittedAt.getTime()).toBeLessThan(ANCHOR.getTime());
      for (const experience of graduate.workExperiences) {
        expect(experience.startDate.getTime()).toBeLessThanOrEqual((experience.endDate ?? ANCHOR).getTime());
      }
    }
  });
});
