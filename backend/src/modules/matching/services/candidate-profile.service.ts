import { Injectable } from '@nestjs/common';
import { EducationsService } from '../../educations/services/educations.service.js';
import { WorkExperienceService } from '../../work-experience/services/work-experience.service.js';
import type { CandidateProfileRecord } from '../types/job-match.types.js';
import { calculateExperienceYears } from '../utils/calculate-experience-years.js';

@Injectable()
export class CandidateProfileService {
  constructor(
    private readonly educationsService: EducationsService,
    private readonly workExperienceService: WorkExperienceService,
  ) {}

  async findCandidateProfile(userId: string): Promise<CandidateProfileRecord> {
    const [educations, experiences] = await Promise.all([
      this.educationsService.findAll(userId),
      this.workExperienceService.findAll(userId),
    ]);

    return {
      career: educations[0]?.degree ?? null,
      experienceYears: calculateExperienceYears(
        experiences.map(({ startDate, endDate, isCurrent }) => ({
          startDate: new Date(startDate),
          endDate: endDate === null ? null : new Date(endDate),
          isCurrent,
        })),
        new Date(),
      ),
    };
  }
}
