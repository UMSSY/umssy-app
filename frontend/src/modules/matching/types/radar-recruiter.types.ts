import type { AffinityAxisId, AxisScores } from "./matching-types";

export type RadarAxisId = AffinityAxisId;

export interface RadarAxis {
  id: RadarAxisId;
  label: string;
}

export const RADAR_AXES: RadarAxis[] = [
  { id: "desarrollo", label: "Desarrollo" },
  { id: "cloud-devops", label: "Cloud/DevOps" },
  { id: "data-ai", label: "Data/AI" },
  { id: "qa", label: "QA" },
  { id: "ciberseguridad", label: "Ciberseguridad" },
  { id: "gobernanza-ti", label: "Gobernanza TI" },
];

export interface RecruiterVacancy {
  id: string;
  title: string;
  companyId: string;
}

export interface RecruiterTarget {
  id: string;
  title: string;
  target: AxisScores;
}

export interface RecruiterComparison {
  match: number;
  gaps: AxisScores;
}

export interface PublishedEvidence {
  id: string;
  name: string;
}

export type RecruiterApplicationState =
  | "applied"
  | "interview"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface RecruiterApplicant {
  applicationId: string;
  userId: string;
  name: string;
  headline: string;
  email: string | null;
  phone: string | null;
  appliedAt: string;
  state: RecruiterApplicationState;
  canViewCv: boolean;
  version: number;
  average: number;
  scores: AxisScores;
  evidence: Record<string, PublishedEvidence[]>;
  comparison: RecruiterComparison;
  skills: string[];
}

export interface RecruiterApplicantsResponse {
  vacancy: RecruiterTarget;
  applicants: RecruiterApplicant[];
}

export interface AreaEvidenceEducation {
  id: string;
  degree: string;
  institution: string;
  year: number;
  description?: string | null;
}

export interface AreaEvidenceCertification {
  id: string;
  name: string;
  issuer: string;
  year: number;
}

export interface AreaEvidenceExperience {
  id: string;
  position: string;
  companyName: string;
  duration: string;
  description?: string | null;
}

export interface AreaEvidence {
  education: AreaEvidenceEducation[];
  certifications: AreaEvidenceCertification[];
  experiences: AreaEvidenceExperience[];
  tags: string[];
}

export const EMPTY_AREA_EVIDENCE: AreaEvidence = {
  education: [],
  certifications: [],
  experiences: [],
  tags: [],
};
