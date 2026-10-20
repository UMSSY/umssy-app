import { Injectable, NotFoundException } from '@nestjs/common';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import { VacancyRankingService } from '../../matching/services/vacancy-ranking.service.js';
import { JobOffersService } from './job-offers.service.js';

export interface RecommendedJobResponse {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  score: number;
  matchedSkills: string[];
  skills: string[];
}

export interface JobRecommendationsResponse {
  isProfileComplete: boolean;
  items: RecommendedJobResponse[];
}

export interface JobMatchRequirementResponse {
  name: string;
  status: 'Cumple' | 'Pendiente';
}

export interface JobMatchDetailResponse {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  description: string;
  score: number;
  requirements: JobMatchRequirementResponse[];
  hasPendingRequirements: boolean;
}

@Injectable()
export class JobMatchingService {
  constructor(
    private readonly jobOffersService: JobOffersService,
    private readonly userSkillService: UserSkillService,
    private readonly vacancyRankingService: VacancyRankingService,
  ) {}

  async getRecommendations(
    userId: string,
  ): Promise<JobRecommendationsResponse> {
    const userSkills = await this.userSkillService.getUserSkills(userId);

    if (userSkills.length === 0) {
      return {
        isProfileComplete: false,
        items: [],
      };
    }

    const userSkillNames = new Set(
      userSkills.map((skill) => skill.name.toLocaleLowerCase()),
    );

    const offers = await this.jobOffersService.listPublished();

    const evaluatedOffers = offers.map((offer) => {
      const skills = offer.skills.map((skill) => skill.name);
      const matchedSkills = skills.filter((skill) =>
        userSkillNames.has(skill.toLocaleLowerCase()),
      );

      return {
        offer,
        skills,
        matchedSkills,
        // Carrera y experiencia no se diferencian mientras el esquema
        // no almacene esos criterios para el usuario y la vacante.
        careerMatch: true,
        experienceMatch: true,
        allRequiredSkillsMatch: matchedSkills.length === skills.length,
      };
    });

    const rankedOffers = this.vacancyRankingService.rank(evaluatedOffers);

    return {
      isProfileComplete: true,
      items: rankedOffers
        .filter(({ matchedSkills }) => matchedSkills.length > 0)
        .map(({ offer, skills, matchedSkills }) => ({
          jobOfferId: offer.id,
          title: offer.title,
          companyName: offer.company.name,
          modality: offer.modality,
          score: this.calculateScore(matchedSkills.length, skills.length),
          matchedSkills,
          skills,
        })),
    };
  }

  async getJobMatch(
    userId: string,
    jobOfferId: string,
  ): Promise<JobMatchDetailResponse> {
    const [userSkills, offers] = await Promise.all([
      this.userSkillService.getUserSkills(userId),
      this.jobOffersService.listPublished(),
    ]);

    const offer = offers.find((item) => item.id === jobOfferId);

    if (!offer) {
      throw new NotFoundException('La vacante ya no está disponible.');
    }

    const userSkillNames = new Set(
      userSkills.map((skill) => skill.name.toLocaleLowerCase()),
    );

    const requirements: JobMatchRequirementResponse[] = offer.skills.map(
      ({ name }) => ({
        name,
        status: userSkillNames.has(name.toLocaleLowerCase())
          ? 'Cumple'
          : 'Pendiente',
      }),
    );

    const matchedCount = requirements.filter(
      ({ status }) => status === 'Cumple',
    ).length;

    return {
      jobOfferId: offer.id,
      title: offer.title,
      companyName: offer.company.name,
      modality: offer.modality,
      description: offer.description,
      score: this.calculateScore(requirements.length > 0 ? matchedCount : 0, requirements.length),
      requirements,
      hasPendingRequirements: requirements.some(
        ({ status }) => status === 'Pendiente',
      ),
    };
  }

  private calculateScore(matchedCount: number, requiredCount: number): number {
    if (requiredCount === 0) {
      return 0;
    }

    return Math.round((matchedCount / requiredCount) * 100);
  }
}
