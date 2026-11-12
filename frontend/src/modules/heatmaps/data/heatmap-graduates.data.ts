import { HEATMAP_SKILLS } from "../constants/heatmap-dimensions.constants";
import type { HeatmapCareerId, HeatmapEmploymentStatus, HeatmapGraduateRecord } from "../types/heatmap-graduate-record.types";

// TODO: Eliminar este generador cuando el backend publique GET /analytics/heatmap/:type.
const RECORD_COUNT = 320;
const FIRST_ANSWER_MS = Date.parse("2022-01-10T12:00:00-04:00");
const LAST_ANSWER_MS = Date.parse("2026-11-10T12:00:00-04:00");

const SKILL_WEIGHTS: Record<string, { systems: number; informatics: number; perYear: number }> = {
  sql: { systems: 0.72, informatics: 0.64, perYear: 0.02 },
  javascript: { systems: 0.58, informatics: 0.66, perYear: 0.01 },
  python: { systems: 0.46, informatics: 0.52, perYear: 0.0 },
  java: { systems: 0.4, informatics: 0.3, perYear: 0.03 },
  react: { systems: 0.36, informatics: 0.48, perYear: -0.01 },
  nodejs: { systems: 0.3, informatics: 0.42, perYear: 0.0 },
  docker: { systems: 0.22, informatics: 0.26, perYear: 0.05 },
  cloud: { systems: 0.16, informatics: 0.2, perYear: 0.05 },
  git: { systems: 0.68, informatics: 0.74, perYear: 0.01 },
  "machine-learning": { systems: 0.1, informatics: 0.18, perYear: 0.01 },
};

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pickEmploymentStatus(random: () => number, skillCount: number): HeatmapEmploymentStatus {
  const roll = random() - skillCount * 0.025;
  if (roll < 0.45) return "employed-in-field";
  if (roll < 0.65) return "employed-other-field";
  if (roll < 0.8) return "self-employed";
  return "job-seeking";
}

function toBoliviaIso(timestamp: number): string {
  return new Date(timestamp - 4 * 3_600_000).toISOString().replace(/\.\d{3}Z$/, "-04:00");
}

function buildRecord(index: number, random: () => number): HeatmapGraduateRecord {
  const career: HeatmapCareerId = random() < 0.56 ? "systems" : "informatics";
  const experienceYears = random() < 0.12 ? null : Math.round(random() * 100) / 10;
  const years = experienceYears ?? 1;
  const skills = HEATMAP_SKILLS.filter(({ id }) => {
    const weight = SKILL_WEIGHTS[id];
    return random() < Math.min(0.95, weight[career] + weight.perYear * years);
  }).map(({ id }) => id);
  const hasSkills = random() > 0.06;
  const recordSkills = hasSkills ? skills : [];
  const nlpSkills = random() < 0.14 ? [] : recordSkills.filter(() => random() < 0.85);
  const monthlySalary = random() < 0.2 ? null : Math.round(2200 + years * 950 + recordSkills.length * 260 + random() * 2600);

  return {
    id: `graduate-${index + 1}`,
    career,
    answeredAt: toBoliviaIso(FIRST_ANSWER_MS + random() * (LAST_ANSWER_MS - FIRST_ANSWER_MS)),
    skills: recordSkills,
    nlpSkills,
    monthlySalary,
    employmentStatus: random() < 0.08 ? null : pickEmploymentStatus(random, recordSkills.length),
    experienceYears,
  };
}

export function generateHeatmapGraduates(count = RECORD_COUNT, seed = 2026): HeatmapGraduateRecord[] {
  const random = createRandom(seed);
  return Array.from({ length: count }, (_, index) => buildRecord(index, random));
}

export const HEATMAP_GRADUATES_MOCK: HeatmapGraduateRecord[] = generateHeatmapGraduates();
