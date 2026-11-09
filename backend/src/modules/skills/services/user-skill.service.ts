import { UserSkillEvidenceRepository } from '../repositories/user-skill-evidence.repository.js';
import { Injectable } from '@nestjs/common';
import { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import { ProfileService } from '../../profile/services/profile.service.js';
import { DuplicateSkillException } from '../exceptions/duplicate-skill.exception.js';
import { SkillNotFoundException } from '../exceptions/skill-not-found.exception.js';
import { SkillMapper } from '../mappers/skill.mapper.js';
import { SkillRepository } from '../repositories/skill.repository.js';
import { UserSkillRepository } from '../repositories/user-skill.repository.js';
import type { UpdateUserSkillsRequest } from '../requests/update-user-skills.request.js';
import type { SkillResponse } from '../responses/skill.response.js';

@Injectable()
export class UserSkillService {
  constructor(
    private readonly userSkillRepository: UserSkillRepository,
    private readonly skillRepository: SkillRepository,
    private readonly profileService: ProfileService,
    private readonly skillMapper: SkillMapper,
    private readonly skillsAnalysis: ProfileSkillsAnalysisService,
    private readonly evidence: UserSkillEvidenceRepository,
  ) {}

  replaceExperienceEvidence(
    userId: string,
    experienceId: string,
    skillIds: string[],
  ) {
    return this.evidence.replaceDetected(userId, experienceId, skillIds);
  }

  async getProfessionalSkills(userId: string): Promise<SkillResponse[]> {
    const records = await this.userSkillRepository.findAllByUserId(userId);
    return records.map((record) =>
      this.skillMapper.toUserSkillResponse(record),
    );
  }

  async getUserSkills(userId: string): Promise<SkillResponse[]> {
    await this.ensureProfileExists(userId);

    const records = await this.userSkillRepository.findByUserId(userId);
    return records.map((record) =>
      this.skillMapper.toUserSkillResponse(record),
    );
  }

  async updateUserSkills(
    userId: string,
    request: UpdateUserSkillsRequest,
  ): Promise<SkillResponse[]> {
    await this.ensureProfileExists(userId);

    const { skillIds } = request;

    if (new Set(skillIds).size !== skillIds.length) {
      throw new DuplicateSkillException();
    }

    const skills = await this.skillRepository.findByIds(skillIds);

    if (skills.length !== skillIds.length) {
      throw new SkillNotFoundException();
    }

    const records = await this.userSkillRepository.replaceForUser(
      userId,
      skillIds,
    );
    await this.skillsAnalysis.refreshAfterChange(userId);
    return records.map((record) =>
      this.skillMapper.toUserSkillResponse(record),
    );
  }

  private async ensureProfileExists(userId: string): Promise<void> {
    await this.profileService.ensureProfileExists(userId);
  }
}
