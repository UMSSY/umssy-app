export interface HeatmapSeedWorkExperience {
  company: string;
  position: string;
  startDate: Date;
  endDate: Date | null;
}

export interface HeatmapSeedSkill {
  name: string;
  source: 'manual' | 'nlp';
}

export interface HeatmapSeedGraduate {
  number: number;
  firstName: string;
  lastName: string;
  career: string;
  graduationYear: number;
  skills: HeatmapSeedSkill[];
  workExperiences: HeatmapSeedWorkExperience[];
  response: {
    submittedAt: Date;
    employmentOptionIndex: number;
    salaryOptionIndex: number | null;
  } | null;
}
