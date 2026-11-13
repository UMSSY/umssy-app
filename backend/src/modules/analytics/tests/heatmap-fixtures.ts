import type { HeatmapGraduate, HeatmapGraduateRecord } from '../types/heatmap-graduate.types.js';

let sequence = 0;

export const SQL = { id: 'skill-sql', name: 'SQL', isNlp: false };
export const PYTHON = { id: 'skill-python', name: 'Python', isNlp: false };
export const GIT = { id: 'skill-git', name: 'Git', isNlp: false };
export const nlp = (skill: typeof SQL) => ({ ...skill, isNlp: true });

export function graduate(overrides: Partial<HeatmapGraduate> = {}): HeatmapGraduate {
  sequence += 1;
  return {
    userId: `user-${sequence}`,
    careerId: 'career-systems',
    answeredAt: new Date('2025-03-01T14:00:00.000Z'),
    skills: [],
    employmentStatus: null,
    salaryRange: null,
    experienceYears: null,
    ...overrides,
  };
}

export function record(overrides: Partial<HeatmapGraduateRecord> = {}): HeatmapGraduateRecord {
  return {
    respondentId: 'user-1',
    submittedAt: new Date('2025-03-01T14:00:00.000Z'),
    answers: [],
    respondent: {
      approvedAccessRequest: { careerId: 'career-systems' },
      userSkills: [],
      workExperiences: [],
    },
    ...overrides,
  };
}
