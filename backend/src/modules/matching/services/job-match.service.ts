import { Injectable } from '@nestjs/common';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import { JobOfferNotAvailableException } from '../exceptions/job-offer-not-available.exception.js';
import { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { JobMatchResponse } from '../types/job-match.types.js';
import {
  buildScoreRequirements,
  hasPendingRequirements,
  toCategorizedRequirements,
} from '../utils/build-score-requirements.js';
import { WeightedScoreService } from './weighted-score.service.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class JobMatchService {
  constructor(
    private readonly jobMatchRepository: JobMatchRepository,
    private readonly userSkillService: UserSkillService,
    private readonly weightedScoreService: WeightedScoreService,
    private readonly prisma: PrismaService,
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

    const userSkills = await this.userSkillService.getUserSkills(userId);

    const educationRecord = await this.prisma.education.findFirst({
      where: { userId },
      orderBy: { startDate: 'desc' },
      select: { degree: true },
    });

    const experiences = await this.prisma.workExperience.findMany({
      where: { userId },
      select: { startDate: true, endDate: true, isCurrent: true },
    });

    const totalExperienceYears = experiences.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return total + (months / 12);
    }, 0);

    const requirements = buildScoreRequirements(
      { 
        skills: vacancy.skills.map(({ skill }) => skill.name),
        careers: [],            
        minExperienceYears: 0,  
        others: [],             
      },
      { 
        skills: userSkills.map(({ name }) => name),
        career: educationRecord?.degree ?? null, 
        experienceYears: totalExperienceYears,   
      },
    );

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
