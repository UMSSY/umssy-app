import { MS_PER_YEAR } from '../constants/heatmap.constants.js';
import {
  HEATMAP_SEED_CAREERS,
  HEATMAP_SEED_COMPANIES,
  HEATMAP_SEED_FIRST_NAMES,
  HEATMAP_SEED_FIRST_RESPONSE,
  HEATMAP_SEED_GRADUATES,
  HEATMAP_SEED_LAST_NAMES,
  HEATMAP_SEED_POSITIONS,
  HEATMAP_SEED_RANDOM_SEED,
  HEATMAP_SEED_SKILLS,
} from '../constants/heatmap-seed.constants.js';
import type {
  HeatmapSeedGraduate,
  HeatmapSeedSkill,
  HeatmapSeedWorkExperience,
} from '../types/heatmap-seed.types.js';
import { createSeededRandom, pick, type RandomSource } from './seeded-random.util.js';

const DAY_MS = 86_400_000;

function toDateOnly(time: number): Date {
  const date = new Date(time);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function planWorkExperiences(
  years: number | null,
  anchor: Date,
  random: RandomSource,
): HeatmapSeedWorkExperience[] {
  if (years === null) return [];
  const segments = years < 2 ? 1 : 1 + Math.floor(random() * 3);
  const segmentMs = (years * MS_PER_YEAR) / segments;
  const isCurrent = random() < 0.8;
  let end = anchor.getTime() - (isCurrent ? 0 : Math.floor(random() * 300) * DAY_MS);

  const periods: HeatmapSeedWorkExperience[] = [];
  for (let index = 0; index < segments; index++) {
    const start = end - segmentMs;
    periods.unshift({
      company: pick(HEATMAP_SEED_COMPANIES, random),
      position: pick(HEATMAP_SEED_POSITIONS, random),
      startDate: toDateOnly(start),
      endDate: index === 0 && isCurrent ? null : toDateOnly(end),
    });
    end = start - DAY_MS;
  }
  return periods;
}

function planSkills(
  careerIndex: number,
  years: number,
  random: RandomSource,
): HeatmapSeedSkill[] {
  const allManual = random() < 0.15;
  return HEATMAP_SEED_SKILLS.filter((skill) => {
    const base = careerIndex === 0 ? skill.systems : skill.informatics;
    return random() < Math.min(0.95, base + skill.perYear * years);
  }).map((skill) => ({
    name: skill.name,
    source: !allManual && random() < 0.6 ? 'nlp' : 'manual',
  }));
}

function planEmployment(skillCount: number, years: number, random: RandomSource): number {
  const roll = random() + 0.22 - skillCount * 0.035 - years * 0.012;
  if (roll < 0.4) return 0;
  if (roll < 0.6) return 1;
  if (roll < 0.75) return 2;
  return 3;
}

function planSalary(skillCount: number, years: number, employment: number, random: RandomSource): number | null {
  if (random() < 0.18) return null;
  if (employment === 3) return random() < 0.7 ? 0 : 1;
  const amount = 1200 + years * 850 + skillCount * 240 + random() * 2400;
  if (amount <= 3000) return 0;
  if (amount <= 5000) return 1;
  if (amount <= 8000) return 2;
  return amount <= 12000 ? 3 : 4;
}

export function buildHeatmapSeedPlan(
  anchor: Date,
  count = HEATMAP_SEED_GRADUATES,
  seed = HEATMAP_SEED_RANDOM_SEED,
): HeatmapSeedGraduate[] {
  const random = createSeededRandom(seed);
  const firstResponse = new Date(HEATMAP_SEED_FIRST_RESPONSE).getTime();
  const lastResponse = Math.max(firstResponse, anchor.getTime() - DAY_MS);

  return Array.from({ length: count }, (_, index) => {
    const careerIndex = random() < 0.55 ? 0 : 1;
    const experienceYears = random() < 0.12 ? null : Math.round((0.3 + random() ** 1.7 * 10.7) * 10) / 10;
    const years = experienceYears ?? 0;
    const skills = random() < 0.05 ? [] : planSkills(careerIndex, years, random);
    const employment = planEmployment(skills.length, years, random);
    const salary = planSalary(skills.length, years, employment, random);
    const responds = random() >= 0.08;

    return {
      number: index + 1,
      firstName: pick(HEATMAP_SEED_FIRST_NAMES, random),
      lastName: pick(HEATMAP_SEED_LAST_NAMES, random),
      career: HEATMAP_SEED_CAREERS[careerIndex]!,
      graduationYear: 2016 + Math.floor(random() * 10),
      skills,
      workExperiences: planWorkExperiences(experienceYears, anchor, random),
      response: responds
        ? {
            submittedAt: new Date(firstResponse + random() * (lastResponse - firstResponse)),
            employmentOptionIndex: employment,
            salaryOptionIndex: salary,
          }
        : null,
    };
  });
}
