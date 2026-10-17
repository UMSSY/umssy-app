import { Injectable } from '@nestjs/common';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import type { JobOfferResponse } from '../../job-offers/responses/job-offer.response.js';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import type {
  RecommendationsResponse,
  RecommendedJobResponse,
} from '../types/matching.types.js';

interface ScoredOffer {
  item: RecommendedJobResponse;
  createdAt: number;
}

@Injectable()
export class JobRecommendationsService {
  constructor(
    private readonly jobOffersService: JobOffersService,
    private readonly userSkillService: UserSkillService,
  ) {}

  async getRecommendations(userId: string): Promise<RecommendationsResponse> {
    const userSkillIds = await this.loadUserSkillIds(userId);
    if (userSkillIds.size === 0) return { isProfileComplete: false, items: [] };

    const offers = await this.jobOffersService.listPublished();
    const items = offers
      .map((offer) => this.score(offer, userSkillIds))
      .filter(({ item }) => item.score > 0)
      .sort((left, right) => right.item.score - left.item.score || right.createdAt - left.createdAt)
      .map(({ item }) => item);

    return { isProfileComplete: true, items };
  }

  private async loadUserSkillIds(userId: string): Promise<Set<string>> {
    try {
      const skills = await this.userSkillService.getUserSkills(userId);
      return new Set(skills.map((skill) => skill.id));
    } catch (error) {
      if (error instanceof ProfileNotFoundException) return new Set();
      throw error;
    }
  }

  private score(offer: JobOfferResponse, userSkillIds: Set<string>): ScoredOffer {
    const matched = offer.skills.filter((skill) => userSkillIds.has(skill.id));
    const score =
      offer.skills.length === 0 ? 0 : Math.round((matched.length / offer.skills.length) * 100);

    return {
      createdAt: Date.parse(offer.createdAt),
      item: {
        jobOfferId: offer.id,
        title: offer.title,
        companyName: offer.company.name,
        modality: offer.modality,
        score,
        matchedSkills: matched.map((skill) => skill.name),
        skills: offer.skills.map((skill) => skill.name),
      },
    };
  }
}
