import { Injectable } from '@nestjs/common';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import { DEFAULT_JOB_ALERT_MODE } from '../constants/job-alert-preference.constants.js';
import type { JobAlertMode } from '../enums/job-alert-mode.enum.js';
import { JobAlertSkillsRequiredException } from '../exceptions/job-alert-skills-required.exception.js';
import { JobAlertPreferencesRepository } from '../repositories/job-alert-preferences.repository.js';
import type { JobAlertPreference } from '../types/job-alert-preference.types.js';
import { parseJobAlertMode } from '../utils/parse-job-alert-mode.js';

@Injectable()
export class JobAlertPreferencesService {
  constructor(
    private readonly repository: JobAlertPreferencesRepository,
    private readonly userSkillService: UserSkillService,
  ) {}

  async get(userId: string): Promise<JobAlertPreference> {
    const [storedMode, canFilterByProfile] = await Promise.all([
      this.repository.findMode(userId),
      this.hasSkills(userId),
    ]);
    const savedMode = parseJobAlertMode(storedMode);
    return {
      mode: canFilterByProfile ? savedMode : DEFAULT_JOB_ALERT_MODE,
      savedMode,
      canFilterByProfile,
    };
  }

  async update(userId: string, mode: JobAlertMode): Promise<JobAlertPreference> {
    if (mode !== DEFAULT_JOB_ALERT_MODE && !(await this.hasSkills(userId))) {
      throw new JobAlertSkillsRequiredException();
    }
    await this.repository.upsertMode(userId, mode);
    return this.get(userId);
  }

  private async hasSkills(userId: string): Promise<boolean> {
    try {
      const skills = await this.userSkillService.getUserSkills(userId);
      return skills.length > 0;
    } catch (error) {
      if (error instanceof ProfileNotFoundException) return false;
      throw error;
    }
  }
}
