import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { Injectable } from '@nestjs/common';
import { JobMatchSourceService } from '../services/job-match-source.service.js';
import type { CandidateProfile } from '../types/gap-analysis.types.js';
import type { JobMatchRecord } from '../types/job-match.types.js';
import type {
  JobRecommendation,
  JobRecommendations,
} from '../types/job-recommendation.types.js';
import { VacancyRankingService } from './vacancy-ranking.service.js';
import { VacancyScoringService } from './vacancy-scoring.service.js';

@Injectable()
export class JobRecommendationsService {
  constructor(
    private readonly jobOffers: JobOffersService,
    private readonly jobMatchSource: JobMatchSourceService,
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
    const vacancies = await this.jobMatchSource.findPublished(new Date());

    const evaluated = await Promise.all(
      vacancies.map((vacancy) => this.evaluate(vacancy, candidate)),
    );

    const listed = evaluated.filter(({ item }) => item.score > 0);
    const ranked = this.ranking.rank(listed);
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
      id: vacancy.id,
      compatibility: score,
      publishedAt: vacancy.createdAt,
    };
  }
}
