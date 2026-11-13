import type { RadarRecruitmentSourcesService } from '../services/radar-recruitment-sources.service.js';
import type { RecruiterSnapshot } from './recruiter-snapshot.type.js';

export interface RecruiterAreaEvidenceInput {
  education: Awaited<
    ReturnType<RadarRecruitmentSourcesService['ownedEducation']>
  >;
  certifications: Awaited<
    ReturnType<RadarRecruitmentSourcesService['ownedCertifications']>
  >;
  experiences: Awaited<
    ReturnType<RadarRecruitmentSourcesService['ownedExperiences']>
  >;
  publishedSkills: RecruiterSnapshot['evidence'][string];
}
