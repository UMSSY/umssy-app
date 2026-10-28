import { Injectable } from '@nestjs/common';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import { JobOfferNotAvailableException } from '../exceptions/job-offer-not-available.exception.js';
import { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { JobMatchResponse } from '../types/job-match.types.js';
import { toVacancyRequirements } from '../utils/build-vacancy-requirements.js';
import {
  buildScoreRequirements,
  hasPendingRequirements,
  toCategorizedRequirements,
} from '../utils/build-score-requirements.js';
import { CandidateProfileService } from './candidate-profile.service.js';
import { WeightedScoreService } from './weighted-score.service.js';

@Injectable()
export class JobMatchService {
  constructor(
    private readonly jobMatchRepository: JobMatchRepository,
    private readonly userSkillService: UserSkillService,
    private readonly candidateProfileService: CandidateProfileService,
    private readonly weightedScoreService: WeightedScoreService,
  ) {}

  async getMatch(
    userId: string,
    jobOfferId: string,
  ): Promise<JobMatchResponse> {
    const vacancy = await this.jobMatchRepository.findPublishedById(
      jobOfferId,
      new Date(),
    );
    if (!vacancy) {
      throw new JobOfferNotAvailableException();
    }

    const [userSkills, profile] = await Promise.all([
      this.userSkillService.getUserSkills(userId),
      this.candidateProfileService.findCandidateProfile(userId),
    ]);

    const requirements = buildScoreRequirements(toVacancyRequirements(vacancy), {
      skills: userSkills.map(({ name }) => name),
      career: profile.career,
      experienceYears: profile.experienceYears,
    });

    return {
      jobOfferId: vacancy.id,
      title: vacancy.title,
      companyName: vacancy.company.title,
      modality: vacancy.modality.title,
      description: vacancy.description,
      score: this.weightedScoreService.calculate(requirements),
      hasPendingRequirements: hasPendingRequirements(requirements),
      requirements: toCategorizedRequirements(requirements),
    };
  }
}
