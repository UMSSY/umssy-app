import { Injectable } from '@nestjs/common';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { CandidateProfile } from '../types/gap-analysis.types.js';
import type { JobMatchRecord } from '../types/job-match.types.js';
import type {
  JobRecommendation,
  JobRecommendations,
} from '../types/job-recommendation.types.js';
import { toVacancyRequirements } from '../utils/build-vacancy-requirements.js';
import { buildScoreRequirements } from '../utils/build-score-requirements.js';
import type { RequirementState } from '../types/requirement-state.types.js';
import { CandidateProfileService } from './candidate-profile.service.js';
import { VacancyRankingService } from './vacancy-ranking.service.js';
import { WeightedScoreService } from './weighted-score.service.js';

function allFulfilled(requirements: readonly RequirementState[]): boolean {
  return requirements.every(({ status }) => status === 'Cumple');
}

@Injectable()
export class JobRecommendationsService {
  constructor(
    private readonly userSkillService: UserSkillService,
    private readonly candidateProfileService: CandidateProfileService,
    private readonly jobMatchRepository: JobMatchRepository,
    private readonly ranking: VacancyRankingService,
    private readonly score: WeightedScoreService,
  ) {}

  async recommendations(userId: string): Promise<JobRecommendations> {
    const skills = await this.profileSkills(userId);
    if (skills.length === 0) return { isProfileComplete: false, items: [] };

    const [vacancies, profile] = await Promise.all([
      this.jobMatchRepository.findPublished(new Date()),
      this.candidateProfileService.findCandidateProfile(userId),
    ]);
    const candidate: CandidateProfile = {
      skills,
      career: profile.career,
      experienceYears: profile.experienceYears,
    };

    const ranked = this.ranking.rank(
      vacancies.map((vacancy) => this.evaluate(vacancy, candidate)),
    );
    return { isProfileComplete: true, items: ranked.map(({ item }) => item) };
  }

  private async profileSkills(userId: string): Promise<string[]> {
    try {
      const skills = await this.userSkillService.getUserSkills(userId);
      return skills.map(({ name }) => name);
    } catch (error) {
      if (error instanceof ProfileNotFoundException) return [];
      throw error;
    }
  }

  private evaluate(vacancy: JobMatchRecord, candidate: CandidateProfile) {
    const requirements = buildScoreRequirements(
      toVacancyRequirements(vacancy),
      candidate,
    );
    const score = this.score.calculate(requirements);
    const matchedSkills = requirements.skills
      .filter(({ status }) => status === 'Cumple')
      .map(({ name }) => name);
    const item: JobRecommendation = {
      jobOfferId: vacancy.id,
      title: vacancy.title,
      companyName: vacancy.company.title,
      modality: vacancy.modality.title,
      locationUrl: vacancy.locationUrl,
      score,
      skills: requirements.skills.map(({ name }) => name),
      matchedSkills,
    };
    return {
      item,
      compatibility: score,
      matchedSkills,
      careerMatch: allFulfilled(requirements.academicRequirements),
      experienceMatch: allFulfilled(requirements.experienceRequirements),
      allRequiredSkillsMatch: allFulfilled(requirements.skills),
    };
  }
}
