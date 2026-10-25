import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MatchingService } from '../../matching/services/matching.service.js';
import { WeightedScoreService } from '../../matching/services/weighted-score.service.js';
import type { ScoreRequirements } from '../../matching/types/score-requirements.types.js';
import type { RequirementState } from '../../matching/types/requirement-state.types.js';
import { JobOffersService } from './job-offers.service.js';

export interface JobRecommendationItem {
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
  items: JobRecommendationItem[];
}

interface UserSkillRecord {
  skill: { name: string };
}

interface UserEducationRecord {
  degree: string;
}

interface UserWorkExperienceRecord {
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
}

interface UserProfileRecord {
  userSkills: UserSkillRecord[];
  educations: UserEducationRecord[];
  workExperiences: UserWorkExperienceRecord[];
}

@Injectable()
export class JobRecommendationsService {
  constructor(
    private readonly jobOffersService: JobOffersService,
    private readonly matchingService: MatchingService,
    private readonly weightedScoreService: WeightedScoreService,
    private readonly prisma: PrismaService,
  ) {}

  async getRecommendations(userId: string): Promise<JobRecommendationsResponse> {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        userSkills: { select: { skill: { select: { name: true } } } },
        educations: { select: { degree: true } },
        workExperiences: { select: { startDate: true, endDate: true, isCurrent: true } },
      },
    })) as UserProfileRecord | null;

    if (!user) {
      return { isProfileComplete: false, items: [] };
    }

    const userSkills: string[] = user.userSkills.map((s) => s.skill.name);
    const userCareer: string | null = user.educations[0]?.degree ?? null;
    const userExperienceYears: number = this.calculateExperienceYears(user.workExperiences);

    if (userSkills.length === 0) {
      return { isProfileComplete: false, items: [] };
    }

    const vacancies = await this.jobOffersService.listPublished();

    if (vacancies.length === 0) {
      return { isProfileComplete: true, items: [] };
    }

    const scoredItems: JobRecommendationItem[] = vacancies.map((vacancy) => {
      const requiredSkills: string[] = vacancy.skills.map((s) => s.name);

      const matchedSkills: string[] = requiredSkills.filter((skill) =>
        userSkills.some((userSkill: string) => userSkill.toLowerCase() === skill.toLowerCase()),
      );

      const skillsState: RequirementState[] = requiredSkills.map((skill) => ({
        name: skill,
        status: matchedSkills.includes(skill) ? 'Cumple' : 'Pendiente',
      }));

      const requirements: ScoreRequirements = {
        skills: skillsState,
        academicRequirements: [],
        experienceRequirements: [],
        otherRequirements: [],
      };

      const matchPercentage: number = this.weightedScoreService.calculate(requirements);

      return {
        jobOfferId: vacancy.id,
        title: vacancy.title,
        companyName: vacancy.company.name,
        modality: vacancy.modality,
        score: matchPercentage,
        matchedSkills,
        skills: requiredSkills,
      };
    });

    scoredItems.sort((a, b) => b.score - a.score);

    return { isProfileComplete: true, items: scoredItems };
  }

  private calculateExperienceYears(workExperiences: UserWorkExperienceRecord[]): number {
    let totalMonths = 0;
    for (const exp of workExperiences) {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      totalMonths +=
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
    }
    return Math.floor(totalMonths / 12);
  }
}