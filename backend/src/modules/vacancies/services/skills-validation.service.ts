import { Injectable } from '@nestjs/common';
import { SkillsService } from '../../skills/services/skills.service.js';
import { DuplicateSkillsException } from '../exceptions/duplicate-skills.exception.js';
import { SkillNotFoundException } from '../exceptions/skill-not-found.exception.js';
import { TooManySkillsException } from '../exceptions/too-many-skills.exception.js';

export const MAX_SKILLS_PER_VACANCY = 10;

@Injectable()
export class SkillsValidationService {
  constructor(private readonly skillsService: SkillsService) {}

  async validateSkillIds(skillIds: string[]): Promise<void> {
    this.validateMaximumSkills(skillIds);
    this.validateDuplicateSkills(skillIds);

    if (skillIds.length === 0) {
      return;
    }

    const existingSkillIds =
      await this.skillsService.findExistingSkillIds(skillIds);

    if (existingSkillIds.length !== skillIds.length) {
      throw new SkillNotFoundException();
    }
  }

  private validateMaximumSkills(skillIds: string[]): void {
    if (skillIds.length > MAX_SKILLS_PER_VACANCY) {
      throw new TooManySkillsException();
    }
  }

  private validateDuplicateSkills(skillIds: string[]): void {
    const uniqueSkillIds = new Set(skillIds);

    if (uniqueSkillIds.size !== skillIds.length) {
      throw new DuplicateSkillsException();
    }
  }
}