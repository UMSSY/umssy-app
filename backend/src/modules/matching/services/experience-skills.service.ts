import { Injectable } from '@nestjs/common';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import { WorkExperienceService } from '../../work-experience/services/work-experience.service.js';

@Injectable()
export class ExperienceSkillsService {
  constructor(
    private readonly experiences: WorkExperienceService,
    private readonly skills: UserSkillService,
  ) {}
  belongsToUser(experienceId: string, userId: string) {
    return this.experiences.belongsToUser(experienceId, userId);
  }
  replaceDetected(userId: string, experienceId: string, ids: string[]) {
    return this.skills.replaceExperienceEvidence(userId, experienceId, ids);
  }
}
