import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { Injectable } from '@nestjs/common';
import { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { CandidateProfile } from '../types/gap-analysis.types.js';
import type { JobMatchRecord } from '../types/job-match.types.js';
import type {
  JobRecommendation,
  JobRecommendations,
} from '../types/job-recommendation.types.js';
import type { RequirementState } from '../types/requirement-state.types.js';
import { VacancyRankingService } from './vacancy-ranking.service.js';
import { VacancyScoringService } from './vacancy-scoring.service.js';

function allFulfilled(requirements: readonly RequirementState[]): boolean {
  return requirements.every(({ status }) => status === 'Cumple');
}

@Injectable()
export class JobRecommendationsService {
  constructor(
    private readonly jobOffers: JobOffersService,
    private readonly jobMatchRepository: JobMatchRepository,
    private readonly vacancyScoring: VacancyScoringService,
    private readonly ranking: VacancyRankingService,
  ) {}

  async scoresForOffers(
    userId: string,
    ids: string[],
  ): Promise<Map<string, number>> {
    const [vacancies, candidate] = await Promise.all([
      this.jobOffers.findScoringOffers(ids),
      this.vacancyScoring.getCandidate(userId),
    ]);
    const evaluated = await Promise.all(
      vacancies.map((vacancy) => this.evaluate(vacancy, candidate)),
    );
    return new Map(evaluated.map(({ item }) => [item.jobOfferId, item.score]));
  }

  async recommendations(userId: string): Promise<JobRecommendations> {
    const candidate = await this.vacancyScoring.getCandidate(userId);
    if (!candidate.skills.length)
      return { isProfileComplete: false, items: [] };
    const vacancies = await this.jobMatchRepository.findPublished(new Date());

    const evaluated = await Promise.all(
      vacancies.map((vacancy) => this.evaluate(vacancy, candidate)),
    );

    const ranked = this.ranking.rank(evaluated);
    return { isProfileComplete: true, items: ranked.map(({ item }) => item) };
  }

  private async evaluate(vacancy: JobMatchRecord, candidate: CandidateProfile) {
    const { requirements, score } = await this.vacancyScoring.evaluate(
      vacancy,
      candidate,
    );
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
