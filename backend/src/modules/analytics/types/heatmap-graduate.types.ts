import type {
  EMPLOYMENT_STATUSES,
  SALARY_RANGES,
} from '../constants/heatmap.constants.js';

export type EmploymentStatusId = (typeof EMPLOYMENT_STATUSES)[number]['id'];
export type SalaryRangeId = (typeof SALARY_RANGES)[number]['id'];

export interface HeatmapSkill {
  id: string;
  name: string;
  isNlp: boolean;
}

export interface HeatmapGraduate {
  userId: string;
  careerId: string;
  answeredAt: Date;
  skills: HeatmapSkill[];
  employmentStatus: EmploymentStatusId | null;
  salaryRange: SalaryRangeId | null;
  experienceYears: number | null;
}

export interface HeatmapCareer {
  id: string;
  title: string;
}

export interface WorkPeriod {
  startDate: Date;
  endDate: Date | null;
}

export interface HeatmapGraduateRecord {
  respondentId: string;
  submittedAt: Date;
  answers: { question: { statement: string }; option: { label: string } | null }[];
  respondent: {
    approvedAccessRequest: { careerId: string; graduationYear: number } | null;
    userSkills: { source: string; skill: { id: string; name: string } }[];
    workExperiences: WorkPeriod[];
  };
}

export interface HeatmapGraduateSource {
  careerId?: string;
  promotion?: number;
  from?: Date;
  to?: Date;
}
