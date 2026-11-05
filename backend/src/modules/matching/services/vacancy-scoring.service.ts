import { Injectable } from '@nestjs/common';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import type { CandidateProfile } from '../types/gap-analysis.types.js';
import type { JobMatchRecord } from '../types/job-match.types.js';
import type { ScoredVacancy } from '../types/scored-vacancy.types.js';
import { buildScoreRequirements } from '../utils/build-score-requirements.js';
import { toVacancyRequirements } from '../utils/build-vacancy-requirements.js';
import { CandidateProfileService } from './candidate-profile.service.js';
import { RequirementTermsService } from './requirement-terms.service.js';
import { WeightedScoreService } from './weighted-score.service.js';

@Injectable()
export class VacancyScoringService {
  constructor(
    private readonly userSkillService: UserSkillService,
    private readonly candidateProfileService: CandidateProfileService,
    private readonly requirementTermsService: RequirementTermsService,
    private readonly weightedScoreService: WeightedScoreService,
  ) {}

  async getCandidate(userId: string): Promise<CandidateProfile> {
    const [skills, profile] = await Promise.all([
      this.profileSkills(userId),
      this.candidateProfileService.findCandidateProfile(userId),
    ]);
    return { ...profile, skills };
  }

  async evaluate(
    vacancy: JobMatchRecord,
    candidate: CandidateProfile,
  ): Promise<ScoredVacancy> {
    const vacancyRequirements = toVacancyRequirements(vacancy);
    const extractedSkills =
      await this.requirementTermsService.extractAndMatchRequirements(
        vacancy.description ?? '',
      );
    const existingSkillNames = vacancyRequirements.skills.map((skill) =>
      skill.toLowerCase(),
    );
    const newSkillNames = extractedSkills
      .map((skill) => skill.name)
      .filter((name) => !existingSkillNames.includes(name.toLowerCase()));

    const requirements = buildScoreRequirements(
      {
        ...vacancyRequirements,
        skills: [...vacancyRequirements.skills, ...newSkillNames],
      },
      candidate,
    );
    return {
      requirements,
      score: this.weightedScoreService.calculate(requirements),
    };
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
}
