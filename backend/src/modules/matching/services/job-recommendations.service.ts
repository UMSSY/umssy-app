import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { JobOfferResponse } from '../../job-offers/responses/job-offer.response.js';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { JobOfferUnavailableException } from '../exceptions/job-offer-unavailable.exception.js';
import type {
  JobMatch,
  JobRecommendations,
} from '../types/job-recommendation.types.js';
import {
  buildScoreRequirements,
  hasPendingRequirements,
  toCategorizedRequirements,
} from '../utils/build-score-requirements.js';
import { VacancyRankingService } from './vacancy-ranking.service.js';
import { WeightedScoreService } from './weighted-score.service.js';

@Injectable()
export class JobRecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly offers: JobOffersService,
    private readonly ranking: VacancyRankingService,
    private readonly score: WeightedScoreService,
  ) {}

  async recommendations(userId: string): Promise<JobRecommendations> {
    const skills = await this.profileSkills(userId);
    if (skills.length === 0) return { isProfileComplete: false, items: [] };

    const offers = await this.offers.listPublished();
    const ranked = this.ranking.rank(
      offers.map((offer) => {
        const match = this.match(offer, skills);
        return {
          match,
          compatibility: match.score,
          matchedSkills: match.matchedSkills,
          careerMatch: true,
          experienceMatch: true,
          allRequiredSkillsMatch: !match.hasPendingRequirements,
        };
      }),
    );
    return {
      isProfileComplete: true,
      items: ranked.map(({ match }) => ({
        jobOfferId: match.jobOfferId,
        title: match.title,
        companyName: match.companyName,
        modality: match.modality,
        score: match.score,
        skills: match.skills,
        matchedSkills: match.matchedSkills,
      })),
    };
  }

  async detail(userId: string, offerId: string): Promise<JobMatch> {
    const offers = await this.offers.listPublished();
    const offer = offers.find((item) => item.id === offerId);
    if (!offer) throw new JobOfferUnavailableException();
    return this.match(offer, await this.profileSkills(userId));
  }

  private async profileSkills(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userSkills: { select: { skill: { select: { name: true } } } } },
    });
    return user?.userSkills.map(({ skill }) => skill.name) ?? [];
  }

  private match(offer: JobOfferResponse, skills: string[]): JobMatch {
    const requirements = buildScoreRequirements(
      { skills: offer.skills.map((skill) => skill.name) },
      { skills },
    );
    return {
      jobOfferId: offer.id,
      title: offer.title,
      companyName: offer.company.name,
      modality: offer.modality,
      description: offer.description,
      score: this.score.calculate(requirements),
      skills: requirements.skills.map((item) => item.name),
      matchedSkills: requirements.skills
        .filter((item) => item.status === 'Cumple')
        .map((item) => item.name),
      requirements: toCategorizedRequirements(requirements),
      hasPendingRequirements: hasPendingRequirements(requirements),
    };
  }
}
