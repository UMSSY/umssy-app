import { Injectable } from '@nestjs/common';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import {
  JOB_APPLICATION_STATUS,
  WITHDRAWABLE_APPLICATION_STATUSES,
} from '../constants/job-application.constants.js';
import { JobApplicationNotFoundException } from '../exceptions/job-application-not-found.exception.js';
import { JobApplicationNotWithdrawableException } from '../exceptions/job-application-not-withdrawable.exception.js';
import { JobApplicationStatusMissingException } from '../exceptions/job-application-status-missing.exception.js';
import { JobApplicationsRepository } from '../repositories/job-applications.repository.js';
import { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { CandidateProfile } from '../types/gap-analysis.types.js';
import type { MyApplicationResponse } from '../types/my-applications.types.js';
import { toVacancyRequirements } from '../utils/build-vacancy-requirements.js';
import { buildScoreRequirements } from '../utils/build-score-requirements.js';
import { CandidateProfileService } from './candidate-profile.service.js';
import { WeightedScoreService } from './weighted-score.service.js';

@Injectable()
export class MyApplicationsService {
  constructor(
    private readonly repository: JobApplicationsRepository,
    private readonly jobMatchRepository: JobMatchRepository,
    private readonly userSkillService: UserSkillService,
    private readonly candidateProfileService: CandidateProfileService,
    private readonly score: WeightedScoreService,
  ) {}

  async listMine(userId: string): Promise<MyApplicationResponse[]> {
    const applications = await this.repository.findAllByUser(userId);
    if (applications.length === 0) return [];

    const [vacancies, candidate] = await Promise.all([
      this.jobMatchRepository.findByIds(
        applications.map(({ jobOfferId }) => jobOfferId),
      ),
      this.candidate(userId),
    ]);
    const scores = new Map(
      vacancies.map((vacancy) => [
        vacancy.id,
        this.score.calculate(
          buildScoreRequirements(toVacancyRequirements(vacancy), candidate),
        ),
      ]),
    );

    return applications.map((application) => ({
      id: application.id,
      jobOfferId: application.jobOfferId,
      vacancyTitle: application.jobOffer.title,
      companyName: application.jobOffer.company.title,
      affinityPercentage: scores.get(application.jobOfferId) ?? 0,
      status: application.status.title,
      appliedDate: application.appliedAt.toISOString(),
    }));
  }

  async withdraw(userId: string, applicationId: string): Promise<void> {
    const application = await this.repository.findOwned(applicationId, userId);
    if (!application) {
      throw new JobApplicationNotFoundException();
    }
    if (!WITHDRAWABLE_APPLICATION_STATUSES.includes(application.status.title)) {
      throw new JobApplicationNotWithdrawableException();
    }

    const status = await this.repository.findStatusId(
      JOB_APPLICATION_STATUS.WITHDRAWN,
    );
    if (!status) {
      throw new JobApplicationStatusMissingException();
    }
    await this.repository.updateStatus(application.id, status.id);
  }

  private async candidate(userId: string): Promise<CandidateProfile> {
    const [skills, profile] = await Promise.all([
      this.profileSkills(userId),
      this.candidateProfileService.findCandidateProfile(userId),
    ]);
    return {
      skills,
      career: profile.career,
      experienceYears: profile.experienceYears,
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
