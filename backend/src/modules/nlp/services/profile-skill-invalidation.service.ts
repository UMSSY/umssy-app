import { Injectable } from '@nestjs/common';
import { ProfileSkillResultsRepository } from '../repositories/profile-skill-results.repository.js';

@Injectable()
export class ProfileSkillInvalidationService {
  constructor(private readonly results: ProfileSkillResultsRepository) {}

  async markChanged(userId: string): Promise<void> {
    await this.results.registerSourceChange(userId, new Date());
  }
}
